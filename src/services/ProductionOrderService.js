/**
 * ProductionOrderService
 *
 * Manages production order lifecycle:
 * 1. Create production order from sales order
 * 2. Issue raw materials to production
 * 3. Record production output
 * 4. Create finished goods from production
 *
 * KEY RULE: SalesInventory ONLY created after production completion with actual yield
 */

import models from "../models";

class ProductionOrderService {
  /**
   * Create production order from sales allocation
   * Called when raw materials are allocated but finished goods don't exist
   */
  async createProductionOrder(
    orderId,
    productId,
    quantityRequired,
    speciesId,
    sessionUser,
  ) {
    try {
      const productionOrderNo = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const prodOrder = await models.ProductionOrder.create({
        order_no: productionOrderNo,
        order_id: orderId,
        plant_id: "PLANT_001", // TODO: Get from config
        input_species_id: speciesId || productId,
        planned_quantity_kg: parseFloat(quantityRequired),
        planned_start_date: new Date(),
        status: "PLANNED",
        created_by: sessionUser?.pid || sessionUser?.user_id || "system",
        remarks: `Production for sales order ${orderId}. Planned quantity: ${quantityRequired}`,
      });

      console.log(`✅ ProductionOrder created: ${prodOrder.order_no}`);
      return prodOrder;
    } catch (error) {
      console.error("Error creating production order:", error);
      throw error;
    }
  }

  /**
   * Record production output with actual yield
   * Creates finished goods ONLY at this step
   */
  async recordProductionOutput(
    productionOrderId,
    actualQuantityKg,
    wasteageQuantityKg = 0,
    remarks = "",
  ) {
    try {
      const prodOrder =
        await models.ProductionOrder.findByPk(productionOrderId);

      if (!prodOrder) {
        throw new Error(`Production order not found: ${productionOrderId}`);
      }

      const plannedQty = parseFloat(prodOrder.planned_quantity_kg);
      const actualQty = parseFloat(actualQuantityKg);
      const wasteQty = parseFloat(wasteageQuantityKg);

      // Calculate yield percentage
      // Yield = (actual / planned) × 100
      const yieldPercent = (actualQty / plannedQty) * 100;

      console.log(`Production Output Recording:`);
      console.log(`  Planned: ${plannedQty} kg`);
      console.log(`  Actual: ${actualQty} kg`);
      console.log(`  Waste: ${wasteQty} kg`);
      console.log(`  Yield: ${yieldPercent.toFixed(2)}%`);

      // Step 1: Update production order
      await prodOrder.update({
        status: "COMPLETED",
        produced_quantity_kg: actualQty,
        wastage_quantity_kg: wasteQty,
        yield_variance_percent: yieldPercent,
        remarks:
          remarks || `Completed production. Yield: ${yieldPercent.toFixed(2)}%`,
      });

      // Step 2: Create ProductionOutput record
      const prodOutput = await models.ProductionOutput.create({
        production_order_id: productionOrderId,
        product_id: prodOrder.input_species_id,
        actual_quantity_kg: actualQty,
        expected_quantity_kg: plannedQty,
        actual_yield_percent: yieldPercent,
        inventory_posted: false,
      });

      console.log(`✅ ProductionOutput created: ${prodOutput.id}`);

      // Step 3: ✅ CRITICAL: Create SalesInventory from production output
      // This is the ONLY way SalesInventory should be created
      const finishedGoods = await this.createFinishedGoodsFromProduction(
        prodOrder,
        prodOutput,
      );

      // Step 4: Update order allocation status
      if (prodOrder.order_id) {
        await models.Orders.update(
          {
            allocation_status: "ALLOCATED_FROM_PRODUCTION",
            order_status: "READY_FOR_DISPATCH",
          },
          {
            where: { id: prodOrder.order_id },
          },
        );
      }

      return {
        production_order: prodOrder,
        production_output: prodOutput,
        finished_goods: finishedGoods,
        message: `Production completed. ${actualQty}kg finished goods created (yield: ${yieldPercent.toFixed(2)}%)`,
      };
    } catch (error) {
      console.error("Error recording production output:", error);
      throw error;
    }
  }

  /**
   * Create SalesInventory from production output
   * ✅ THIS IS THE ONLY AUTHORIZED WAY TO CREATE FINISHED GOODS
   */
  async createFinishedGoodsFromProduction(prodOrder, prodOutput) {
    try {
      const salesInventory = await models.SalesInventory.create({
        // Product identification
        product_master_id: prodOutput.product_id,
        order_id: prodOrder.order_id,

        // Quantity from ACTUAL PRODUCTION (not planned)
        quantity: parseFloat(prodOutput.actual_quantity_kg),

        // Production traceability (NEW FIELDS)
        production_order_id: prodOrder.id,
        production_output_id: prodOutput.id,
        production_date: new Date(),
        yield_applied_percent: parseFloat(prodOutput.actual_yield_percent),

        // Status tracking
        is_active: true,
        created_by: "system",
        remarks: `Finished goods from Production Order ${prodOrder.order_no}. Yield: ${prodOutput.actual_yield_percent.toFixed(2)}%`,
      });

      console.log(
        `✅ SalesInventory created from production: ${salesInventory.id}`,
      );
      console.log(
        `   Quantity: ${salesInventory.quantity} kg (actual production)`,
      );
      console.log(`   Yield: ${prodOutput.actual_yield_percent.toFixed(2)}%`);
      console.log(`   Source: ProductionOrder ${prodOrder.order_no}`);

      // Update ProductionOutput to mark inventory posted
      await prodOutput.update({
        inventory_posted: true,
      });

      return salesInventory;
    } catch (error) {
      console.error("Error creating finished goods from production:", error);
      throw error;
    }
  }

  /**
   * Get production order details with related data
   */
  async getProductionOrderDetails(productionOrderId) {
    try {
      const prodOrder = await models.ProductionOrder.findByPk(
        productionOrderId,
        {
          include: [
            {
              model: models.Orders,
              as: "sales_order",
              attributes: ["id", "order_no"],
            },
            {
              model: models.ProductionOutput,
              attributes: [
                "id",
                "actual_quantity_kg",
                "expected_quantity_kg",
                "actual_yield_percent",
                "inventory_posted",
              ],
            },
          ],
        },
      );

      return prodOrder;
    } catch (error) {
      console.error("Error fetching production order:", error);
      throw error;
    }
  }

  /**
   * List pending production orders
   */
  async getPendingProductionOrders(limit = 50, offset = 0) {
    try {
      const { count, rows } = await models.ProductionOrder.findAndCountAll({
        where: {
          status: ["PLANNED", "RAW_ISSUED", "IN_PRODUCTION", "READY_FOR_QA"],
        },
        order: [["created_at", "DESC"]],
        limit,
        offset,
        include: [
          {
            model: models.Orders,
            as: "sales_order",
            attributes: ["id", "order_no"],
          },
        ],
      });

      return { count, rows };
    } catch (error) {
      console.error("Error fetching pending production orders:", error);
      throw error;
    }
  }
}

export default new ProductionOrderService();
