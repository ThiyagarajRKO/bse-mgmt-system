"use strict";

const db = require("../models");

class InventoryReconciliationService {
  /**
   * Reconcile inventory stock levels across all tables
   * Ensures PurchaseInventory, SalesInventory, and InventoryStock are synchronized
   */
  async reconcileAllInventory() {
    try {
      console.log("🔄 Starting inventory reconciliation...");

      // Reconcile raw materials (purchase inventory)
      await this.reconcileRawMaterials();

      // Reconcile finished goods (sales inventory)
      await this.reconcileFinishedGoods();

      console.log("✅ Inventory reconciliation completed");
      return {
        success: true,
        message: "Inventory reconciliation completed successfully",
      };
    } catch (error) {
      console.error("❌ Error during inventory reconciliation:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Reconcile raw materials inventory
   */
  async reconcileRawMaterials() {
    try {
      // Get all active procurement products grouped by product
      const procurementProducts = await db.ProcurementProducts.findAll({
        attributes: [
          "product_master_id",
          "procurement_product_type",
          [
            db.sequelize.fn("SUM", db.sequelize.col("procurement_quantity")),
            "total_procured",
          ],
          [
            db.sequelize.fn("SUM", db.sequelize.col("adjusted_quantity")),
            "total_adjusted",
          ],
        ],
        include: [
          {
            model: db.Dispatches,
            as: "Dispatches",
            attributes: [
              [
                db.sequelize.fn("SUM", db.sequelize.col("dispatch_quantity")),
                "total_dispatched",
              ],
            ],
            where: { is_active: true },
            required: false,
          },
        ],
        where: { is_active: true },
        group: [
          "ProcurementProducts.product_master_id",
          "ProcurementProducts.procurement_product_type",
        ],
        raw: true,
      });

      for (const product of procurementProducts) {
        const productId = product.product_master_id;
        const productType = product.procurement_product_type;
        const totalProcured = parseFloat(
          product.total_adjusted || product.total_procured || 0,
        );
        const totalDispatched = parseFloat(
          product["Dispatches.total_dispatched"] || 0,
        );
        const availableQuantity = totalProcured - totalDispatched;

        // Update or create purchase inventory record
        await this.updatePurchaseInventory(
          productId,
          productType,
          availableQuantity,
        );

        // Update inventory stock
        await this.updateInventoryStock(
          productId,
          "RAW_INVENTORY",
          null,
          availableQuantity,
        );
      }

      console.log("✅ Raw materials reconciliation completed");
    } catch (error) {
      console.error("Error reconciling raw materials:", error);
      throw error;
    }
  }

  /**
   * Reconcile finished goods inventory
   */
  async reconcileFinishedGoods() {
    try {
      // Get all active sales inventory grouped by product
      const salesInventory = await db.SalesInventory.findAll({
        attributes: [
          "product_master_id",
          [
            db.sequelize.fn("SUM", db.sequelize.col("quantity")),
            "total_quantity",
          ],
        ],
        where: { is_active: true },
        group: ["SalesInventory.product_master_id"],
        raw: true,
      });

      for (const inventory of salesInventory) {
        const productId = inventory.product_master_id;
        const totalQuantity = parseFloat(inventory.total_quantity || 0);

        // Update inventory stock for finished goods
        await this.updateInventoryStock(
          productId,
          "FINISHED_GOODS",
          null,
          totalQuantity,
        );
      }

      console.log("✅ Finished goods reconciliation completed");
    } catch (error) {
      console.error("Error reconciling finished goods:", error);
      throw error;
    }
  }

  /**
   * Update or create purchase inventory record
   */
  async updatePurchaseInventory(productId, productType, availableQuantity) {
    const existingRecord = await db.PurchaseInventory.findOne({
      where: {
        product_master_id: productId,
        procurement_product_type: productType,
        is_active: true,
      },
    });

    if (existingRecord) {
      await existingRecord.update({
        quantity: availableQuantity,
        available_quantity: availableQuantity,
        updated_at: new Date(),
      });
    } else {
      await db.PurchaseInventory.create({
        product_master_id: productId,
        procurement_product_type: productType,
        quantity: availableQuantity,
        available_quantity: availableQuantity,
        is_active: true,
      });
    }
  }

  /**
   * Update or create inventory stock record
   */
  async updateInventoryStock(productId, unitId, lotId, quantity) {
    let inventoryStock = await db.InventoryStock.findOne({
      where: {
        product_id: productId,
        unit_id: unitId,
        lot_id: lotId,
      },
    });

    if (inventoryStock) {
      await inventoryStock.update({
        on_hand_qty: quantity,
        available_qty: quantity,
        updated_at: new Date(),
      });
    } else {
      await db.InventoryStock.create({
        id: require("uuid").v4(),
        product_id: productId,
        unit_id: unitId,
        lot_id: lotId,
        on_hand_qty: quantity,
        available_qty: quantity,
        reserved_qty: 0,
        damaged_qty: 0,
        is_active: true,
      });
    }
  }

  /**
   * Get inventory summary for a specific product
   */
  async getInventorySummary(productId) {
    try {
      // Get purchase inventory (raw materials)
      const purchaseInventory = await db.PurchaseInventory.findAll({
        where: {
          product_master_id: productId,
          is_active: true,
        },
        attributes: [
          "procurement_product_type",
          [
            db.sequelize.fn("SUM", db.sequelize.col("available_quantity")),
            "total_available",
          ],
        ],
        group: ["PurchaseInventory.procurement_product_type"],
        raw: true,
      });

      // Get sales inventory (finished goods)
      const salesInventory = await db.SalesInventory.findOne({
        where: {
          product_master_id: productId,
          is_active: true,
        },
        attributes: [
          [
            db.sequelize.fn("SUM", db.sequelize.col("quantity")),
            "total_available",
          ],
        ],
        raw: true,
      });

      // Get inventory stock summary
      const inventoryStock = await db.InventoryStock.findAll({
        where: {
          product_id: productId,
          is_active: true,
        },
        attributes: ["unit_id", "on_hand_qty", "available_qty"],
        raw: true,
      });

      return {
        product_id: productId,
        purchase_inventory: purchaseInventory,
        sales_inventory: {
          total_available: parseFloat(salesInventory?.total_available || 0),
        },
        inventory_stock: inventoryStock,
      };
    } catch (error) {
      console.error("Error getting inventory summary:", error);
      throw error;
    }
  }
}

module.exports = new InventoryReconciliationService();
