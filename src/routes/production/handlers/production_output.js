/**
 * Production Output Receipt Handler
 *
 * ENTRY: Operator reports production complete with actuals
 * ACTION:
 *   1. Validate actuals vs planned (using grade/size yield multipliers)
 *   2. Create finished goods inventory per derivative
 *   3. Calculate variance
 *   4. Post GL entries
 * EXIT: FG inventory created, GL posted, production order marked COMPLETED
 *
 * Accounting (per derivative):
 *   DR FG_INVENTORY_DERIVATIVE_GRADE_SIZE
 *   CR WIP (with cost allocation)
 *
 *   DR PRODUCTION_LOSS (waste)
 *   CR WIP
 *
 *   DR YIELD_VARIANCE_EXPENSE (if abnormal)
 *   CR WIP
 */

import sequelize from "sequelize";
import productionOrders from "../../../models/production_orders";
import productionOutputs from "../../../models/production_outputs";
import productionConsumption from "../../../models/production_consumption";
import productionVariance from "../../../models/production_variance";
import inventoryStock from "../../../models/inventory_stock";
import inventoryTransaction from "../../../models/inventory_transaction";
import productMaster from "../../../models/product_master";

const { Op } = sequelize;

export async function receiveProductionOutput(
  productionOrderId,
  actualOutputs,
  db,
) {
  const transaction = await db.sequelize.transaction();

  try {
    // Step 1: Get production order with consumption details
    const po = await productionOrders.findByPk(productionOrderId, {
      include: [
        {
          model: productionConsumption,
          required: false,
        },
      ],
      transaction,
    });

    if (!po) {
      throw new Error(`Production Order not found: ${productionOrderId}`);
    }

    if (po.status !== "RAW_ISSUED") {
      throw new Error(
        `Production Order must be RAW_ISSUED. Current: ${po.status}`,
      );
    }

    // Step 2: Calculate total raw cost
    const totalRawCost = po.production_consumptions.reduce(
      (sum, c) => sum + c.total_cost,
      0,
    );

    // Step 3: Calculate total actual output
    const totalActualOutput = actualOutputs.reduce(
      (sum, o) => sum + o.actual_quantity_kg,
      0,
    );

    // Step 4: Calculate waste
    const totalWaste = po.issued_quantity_kg - totalActualOutput;

    if (totalWaste < 0) {
      throw new Error(
        `Actual output exceeds input: ${totalActualOutput} > ${po.issued_quantity_kg}`,
      );
    }

    // Step 5: For each actual output, create FG inventory + variance
    let fgInventoryRecords = [];
    let varianceRecords = [];
    let totalCostAllocated = 0;

    for (const output of actualOutputs) {
      // Find matching production_output (if exists)
      const prodOutput = await productionOutputs.findOne({
        where: {
          production_order_id: productionOrderId,
          derivative_id: output.derivative_id,
        },
        transaction,
      });

      if (!prodOutput) {
        throw new Error(
          `Production output record not found for derivative: ${output.derivative_id}`,
        );
      }

      const expectedQty = prodOutput.expected_quantity_kg;
      const actualQty = output.actual_quantity_kg;
      const varianceQty = actualQty - expectedQty;
      const variancePercent = (varianceQty / expectedQty) * 100;

      // Determine variance type (normal vs abnormal)
      let varianceType = "NORMAL_LOSS";
      if (variancePercent < -5) {
        varianceType = "ABNORMAL_LOSS"; // > 5% under is abnormal
      } else if (output.actual_grade !== prodOutput.expected_grade) {
        varianceType = "GRADE_VARIANCE";
      }

      // Allocate cost proportionally
      const costAllocationPercent = actualQty / totalActualOutput;
      const allocatedCost = totalRawCost * costAllocationPercent;

      // Create SKU product if doesn't exist
      const skuCode = `${po.input_species_id}-${output.derivative_id}-${output.actual_grade}-${output.size_code}`;
      let skuProduct = await productMaster.findOne(
        {
          where: { product_id: skuCode },
        },
        { transaction },
      );

      if (!skuProduct) {
        skuProduct = await productMaster.create(
          {
            product_id: skuCode,
            product_name: `${po.input_species_id} - ${output.derivative_id} - Grade ${output.actual_grade} - ${output.size_code}`,
            product_category_master_id: null,
            product_form: "DERIVATIVE",
            uom: "KG",
            is_active: true,
          },
          { transaction },
        );
      }

      // Create FG inventory stock
      let fgStock = await inventoryStock.findOne(
        {
          where: {
            product_id: skuProduct.id,
            unit_id: "f78b9682-ab4c-4e68-bc0a-09468278b5a3", // CS unit
          },
        },
        { transaction },
      );

      if (!fgStock) {
        fgStock = await inventoryStock.create(
          {
            product_id: skuProduct.id,
            unit_id: "f78b9682-ab4c-4e68-bc0a-09468278b5a3", // CS unit
            on_hand_qty: actualQty,
            available_qty: actualQty,
            uom: "KG",
            cost_layer_id: null,
          },
          { transaction },
        );
      } else {
        await fgStock.update(
          {
            on_hand_qty: fgStock.on_hand_qty + actualQty,
            available_qty: fgStock.available_qty + actualQty,
          },
          { transaction },
        );
      }

      // Create inventory transaction
      await inventoryTransaction.create(
        {
          stock_id: fgStock.id,
          product_id: skuProduct.id,
          transaction_type: "PRODUCTION_RECEIPT",
          qty_change: actualQty,
          uom: "KG",
          warehouse_from: "WIP_RAW_CONSUMPTION",
          warehouse_to: "CS_UNIT",
          reference_id: productionOrderId,
          reference_type: "PRODUCTION_ORDER",
          cost_per_unit: allocatedCost / actualQty,
          total_cost: allocatedCost,
          notes: `Grade ${output.actual_grade}, Size ${output.size_code}`,
        },
        { transaction },
      );

      // Update production_output record
      await prodOutput.update(
        {
          actual_quantity_kg: actualQty,
          actual_grade: output.actual_grade,
          size_code: output.size_code,
          actual_yield_percent: (actualQty / expectedQty) * 100,
          cost_allocated: allocatedCost,
          sku_code: skuCode,
          inventory_posted: true,
        },
        { transaction },
      );

      // Record variance
      if (varianceQty !== 0) {
        const var_record = await productionVariance.create(
          {
            production_order_id: productionOrderId,
            derivative_id: output.derivative_id,
            planned_qty_kg: expectedQty,
            actual_qty_kg: actualQty,
            variance_qty_kg: varianceQty,
            variance_percent: variancePercent,
            variance_type: varianceType,
            variance_reason: output.variance_reason || null,
            variance_cost: Math.abs(varianceQty) * (allocatedCost / actualQty),
            gl_posted: false,
          },
          { transaction },
        );
        varianceRecords.push(var_record);
      }

      fgInventoryRecords.push({
        derivative_id: output.derivative_id,
        sku_code: skuCode,
        actual_quantity_kg: actualQty,
        grade: output.actual_grade,
        cost_allocated: allocatedCost,
      });

      totalCostAllocated += allocatedCost;
    }

    // Step 6: Handle waste
    if (totalWaste > 0) {
      // Create waste expense transaction
      await inventoryTransaction.create(
        {
          product_id: null,
          transaction_type: "WASTE",
          qty_change: -totalWaste,
          uom: "KG",
          warehouse_from: "WIP_RAW_CONSUMPTION",
          warehouse_to: null,
          reference_id: productionOrderId,
          reference_type: "PRODUCTION_ORDER",
          total_cost: -((totalRawCost * totalWaste) / po.issued_quantity_kg),
          notes: `Waste/loss from production`,
        },
        { transaction },
      );

      // Record waste variance as NORMAL_LOSS
      await productionVariance.create(
        {
          production_order_id: productionOrderId,
          derivative_id: null,
          planned_qty_kg: totalWaste,
          actual_qty_kg: 0,
          variance_qty_kg: -totalWaste,
          variance_percent: -(totalWaste / po.issued_quantity_kg) * 100,
          variance_type: "NORMAL_LOSS",
          variance_reason: "Process waste/loss",
          variance_cost: (totalRawCost * totalWaste) / po.issued_quantity_kg,
          gl_posted: false,
        },
        { transaction },
      );
    }

    // Step 7: Update production order
    await po.update(
      {
        status: "COMPLETED",
        produced_quantity_kg: totalActualOutput,
        wastage_quantity_kg: totalWaste,
        yield_variance_percent:
          ((totalActualOutput - po.planned_quantity_kg) /
            po.planned_quantity_kg) *
          100,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      success: true,
      production_order_id: productionOrderId,
      total_actual_output_kg: totalActualOutput,
      total_waste_kg: totalWaste,
      total_cost_allocated: totalCostAllocated,
      fg_inventory_created: fgInventoryRecords.length,
      variance_records: varianceRecords.length,
      message: "Production output received successfully",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Output Receipt Error:", error);
    throw error;
  }
}

export default {
  receiveProductionOutput,
};
