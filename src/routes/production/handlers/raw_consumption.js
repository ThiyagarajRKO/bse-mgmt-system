/**
 * Raw Material Consumption Handler
 *
 * ENTRY: Production Order starting (operator clicks START)
 * ACTION:
 *   1. Pick from RAW_INVENTORY (FIFO by lot)
 *   2. Move to WIP_RAW_CONSUMPTION
 *   3. Post inventory transactions
 *   4. Absorb cost
 * EXIT: production_consumption records created, inventory transacted
 *
 * Accounting:
 *   DR WIP_RAW_CONSUMPTION
 *   CR RAW_INVENTORY
 */

import sequelize from "sequelize";
import productionOrders from "../../../models/production_orders";
import productionConsumption from "../../../models/production_consumption";
import inventoryStock from "../../../models/inventory_stock";
import inventoryTransaction from "../../../models/inventory_transaction";
import inventoryCostLayer from "../../../models/inventory_cost_layer";
import productMaster from "../../../models/product_master";
import speciesMaster from "../../../models/species_master";

const { Op } = sequelize;

export async function consumeRawMaterial(productionOrderId, db) {
  const transaction = await db.sequelize.transaction();

  try {
    // Step 1: Get production order
    const po = await productionOrders.findByPk(productionOrderId, {
      include: [
        {
          model: speciesMaster,
          attributes: ["id", "species_name", "species_code"],
        },
      ],
      transaction,
    });

    if (!po) {
      throw new Error(`Production Order not found: ${productionOrderId}`);
    }

    if (po.status !== "PLANNED") {
      throw new Error(
        `Production Order must be in PLANNED status. Current: ${po.status}`
      );
    }

    // Step 2: Get or create raw product for this species
    let rawProduct = await productMaster.findOne({
      where: {
        product_code: { [Op.like]: `RAW_${po.species_master.species_code}%` },
        product_form: "WHOLE",
      },
      transaction,
    });

    if (!rawProduct) {
      // Auto-create if doesn't exist
      rawProduct = await productMaster.create(
        {
          product_code: `RAW_${po.species_master.species_code}_WHOLE`,
          product_name: `Raw ${po.species_master.species_name} (Whole)`,
          product_category_master_id: null,
          product_form: "WHOLE",
          uom: "KG",
          is_active: true,
        },
        { transaction }
      );
    }

    // Step 3: Get available inventory (FIFO by cost layer)
    const availableStock = await inventoryStock.findAll({
      where: {
        product_id: rawProduct.id,
        warehouse_code: "RAW_INVENTORY",
        available_qty: { [Op.gt]: 0 },
      },
      include: [
        {
          model: inventoryLot,
          required: true,
          attributes: ["id", "lot_number", "received_date"],
        },
        {
          model: inventoryCostLayer,
          required: true,
          attributes: ["id", "cost_per_unit", "qty_remaining", "fifo_sequence"],
        },
      ],
      order: [["cost_layer_id", "ASC"]], // FIFO order
      transaction,
    });

    if (availableStock.length === 0) {
      throw new Error(
        `No available raw inventory for ${rawProduct.product_code}`
      );
    }

    // Step 4: Consume from lots (FIFO) until we have enough
    let remainingQty = po.planned_quantity_kg;
    const consumptionRecords = [];
    let totalCost = 0;

    for (const stock of availableStock) {
      if (remainingQty <= 0) break;

      const consumeQty = Math.min(remainingQty, stock.available_qty);
      const costPerUnit = stock.cost_layer.cost_per_unit;
      const consumptionCost = consumeQty * costPerUnit;

      // Create consumption record
      const consumption = await productionConsumption.create(
        {
          production_order_id: productionOrderId,
          raw_product_id: rawProduct.id,
          lot_id: stock.lot_id,
          cost_layer_id: stock.cost_layer.id,
          planned_qty_kg: po.planned_quantity_kg,
          consumed_qty_kg: consumeQty,
          cost_per_unit: costPerUnit,
          total_cost: consumptionCost,
          warehouse_code: "RAW_INVENTORY",
          consumption_date: new Date(),
          status: "ISSUED",
        },
        { transaction }
      );

      consumptionRecords.push(consumption);
      totalCost += consumptionCost;
      remainingQty -= consumeQty;

      // Update cost layer
      await stock.cost_layer.update(
        {
          qty_consumed: stock.cost_layer.qty_consumed + consumeQty,
          qty_remaining: stock.cost_layer.qty_remaining - consumeQty,
          total_consumed_cost:
            stock.cost_layer.total_consumed_cost + consumptionCost,
        },
        { transaction }
      );

      // Create inventory transaction: CR RAW
      await inventoryTransaction.create(
        {
          stock_id: stock.id,
          product_id: rawProduct.id,
          transaction_type: "PRODUCTION_CONSUME",
          qty_change: -consumeQty,
          uom: "KG",
          warehouse_from: "RAW_INVENTORY",
          warehouse_to: "WIP_RAW_CONSUMPTION",
          reference_id: productionOrderId,
          reference_type: "PRODUCTION_ORDER",
          batch_id: stock.batch_id || null,
          lot_id: stock.lot_id,
          cost_per_unit: costPerUnit,
          total_cost: -consumptionCost,
          notes: `Consumed from lot ${stock.inventory_lot.lot_number}`,
        },
        { transaction }
      );

      // Update inventory stock
      await stock.update(
        {
          on_hand_qty: stock.on_hand_qty - consumeQty,
          available_qty: stock.available_qty - consumeQty,
          last_transaction_id: null,
        },
        { transaction }
      );

      // Create WIP stock if doesn't exist
      let wipStock = await inventoryStock.findOne(
        {
          where: {
            product_id: rawProduct.id,
            warehouse_code: "WIP_RAW_CONSUMPTION",
            lot_id: stock.lot_id,
          },
        },
        { transaction }
      );

      if (!wipStock) {
        wipStock = await inventoryStock.create(
          {
            product_id: rawProduct.id,
            warehouse_code: "WIP_RAW_CONSUMPTION",
            lot_id: stock.lot_id,
            cost_layer_id: stock.cost_layer.id,
            on_hand_qty: consumeQty,
            available_qty: consumeQty,
            uom: "KG",
          },
          { transaction }
        );
      } else {
        await wipStock.update(
          {
            on_hand_qty: wipStock.on_hand_qty + consumeQty,
            available_qty: wipStock.available_qty + consumeQty,
          },
          { transaction }
        );
      }

      // DR WIP transaction
      await inventoryTransaction.create(
        {
          stock_id: wipStock.id,
          product_id: rawProduct.id,
          transaction_type: "PRODUCTION_CONSUME",
          qty_change: consumeQty,
          uom: "KG",
          warehouse_from: "RAW_INVENTORY",
          warehouse_to: "WIP_RAW_CONSUMPTION",
          reference_id: productionOrderId,
          reference_type: "PRODUCTION_ORDER",
          lot_id: stock.lot_id,
          cost_per_unit: costPerUnit,
          total_cost: consumptionCost,
          notes: `Moved to WIP from lot ${stock.inventory_lot.lot_number}`,
        },
        { transaction }
      );
    }

    // Check if we got enough
    if (remainingQty > 0) {
      throw new Error(
        `Insufficient inventory. Need ${po.planned_quantity_kg}, only found ${
          po.planned_quantity_kg - remainingQty
        }`
      );
    }

    // Step 5: Update production order
    await po.update(
      {
        status: "RAW_ISSUED",
        issued_quantity_kg: po.planned_quantity_kg,
      },
      { transaction }
    );

    await transaction.commit();

    return {
      success: true,
      production_order_id: productionOrderId,
      consumed_quantity_kg: po.planned_quantity_kg,
      total_consumed_cost: totalCost,
      consumption_records: consumptionRecords.length,
      message: "Raw material consumed successfully",
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Consumption Error:", error);
    throw error;
  }
}

export default {
  consumeRawMaterial,
};
