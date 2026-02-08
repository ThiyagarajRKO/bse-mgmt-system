"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProcurementProducts extends Model {
    static associate(models) {
      ProcurementProducts.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.ProcurementLots, {
        as: "pl",
        foreignKey: "procurement_lot_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.ProductMaster, {
        as: "ProductMaster",
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.SupplierMaster, {
        foreignKey: "supplier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProcurementProducts.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // has Many
      ProcurementProducts.hasMany(models.Dispatches, {
        foreignKey: "procurement_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  ProcurementProducts.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      procurement_product_type: {
        type: DataTypes.STRING,
      },
      procurement_quantity: {
        type: DataTypes.INTEGER,
      },
      adjusted_quantity: {
        type: DataTypes.INTEGER,
      },
      procurement_price: {
        type: DataTypes.FLOAT,
      },
      adjusted_price: {
        type: DataTypes.FLOAT,
      },
      adjusted_reason: {
        type: DataTypes.TEXT,
      },
      adjusted_surveyor: {
        type: DataTypes.STRING,
      },
      procurement_totalamount: {
        type: DataTypes.FLOAT,
      },
      procurement_purchaser: {
        type: DataTypes.STRING,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Reference to the sales order for which this procurement product is allocated",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "ProcurementProducts",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
  // Create Hook
  ProcurementProducts.beforeCreate(async (data, options) => {
    try {
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;

      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a procurements data",
        err?.message || err,
      );
    }
  });

  // Create Hook
  ProcurementProducts.afterCreate(async (data, options) => {
    await updateInvenoryQuantity(sequelize, data, options);
  });

  // Update Hook
  ProcurementProducts.beforeUpdate(async (data, options) => {
    try {
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;

      if (data.adjusted_quantity && data.adjusted_price)
        data.procurement_totalamount =
          data.adjusted_quantity * data.adjusted_price;

      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating a procurements data",
        err?.message || err,
      );
    }
  });

  // Update Hook
  ProcurementProducts.afterUpdate(async (data, options) => {
    await updateInvenoryQuantity(sequelize, data, options);
  });

  // Delete Hook
  ProcurementProducts.afterDestroy(async (data, options) => {
    try {
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;

      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting a procurements data",
        err?.message || err,
      );
    }
  });

  return ProcurementProducts;
};

// Utils Functions
const updateInvenoryQuantity = async (sequelize, data, options) => {
  try {
    console.log(
      `[INVENTORY UPDATE] Updating purchase inventory for procurement product ${data?.id}, product_master_id: ${data?.product_master_id}, quantity procured: ${data?.procurement_quantity}`,
    );

    // IMPORTANT: Store THIS procurement_product's quantity only, not a sum of all
    // Each procurement creates a separate inventory record with its own quantity
    const currentQuantity = data?.procurement_quantity || 0;

    console.log(
      `[INVENTORY UPDATE] Current procurement quantity for this product: ${currentQuantity} units`,
    );

    // STEP 1: Create/Update individual record for THIS procurement_product_id ONLY
    // This is crucial for getRawMaterialsForProduct to find it
    const individualInventory =
      await sequelize.models.PurchaseInventory.findOne({
        attributes: ["id", "quantity"],
        where: {
          procurement_product_id: data?.id,
          is_active: true,
        },
        raw: true,
      });

    const { v4: uuidv4 } = require("uuid");

    if (individualInventory?.id) {
      console.log(
        `[INVENTORY UPDATE] Updating individual procurement product inventory record ${individualInventory.id} with quantity ${currentQuantity}`,
      );

      // Get current reserved quantity to recalculate available stock
      const currentRecord = await sequelize.models.PurchaseInventory.findOne({
        attributes: ["reserved_quantity"],
        where: {
          id: individualInventory.id,
          is_active: true,
        },
        raw: true,
      });

      const reservedQty = currentRecord?.reserved_quantity || 0;
      const availableQty = Math.max(0, currentQuantity - reservedQty);

      await sequelize.models.PurchaseInventory.update(
        {
          quantity: currentQuantity,
          available_stock: availableQty,
          updated_at: new Date(),
          updated_by: options?.profile_id,
        },
        {
          where: {
            id: individualInventory?.id,
            is_active: true,
          },
        },
      ).catch((err) => {
        console.error(
          "[INVENTORY UPDATE] Error updating individual inventory:",
          err?.message || err,
        );
      });
    } else {
      console.log(
        `[INVENTORY UPDATE] Creating new individual procurement product inventory for ${data?.id} with quantity ${currentQuantity}`,
      );
      await sequelize.models.PurchaseInventory.create({
        id: uuidv4(),
        procurement_product_id: data?.id,
        product_master_id: data?.product_master_id,
        procurement_product_type: data?.procurement_product_type,
        quantity: currentQuantity,
        available_stock: currentQuantity, // Initialize available_stock equal to total quantity (no reservations yet)
        reserved_quantity: 0, // No reservations initially
        is_active: true,
        created_by: options?.profile_id,
      }).catch((err) => {
        console.error(
          "[INVENTORY UPDATE] Error creating individual inventory:",
          err?.message || err,
        );
      });
    }

    // Update inventory_stock for comprehensive stock tracking
    await updateInventoryStock(sequelize, data, currentQuantity, options);
  } catch (err) {
    console.log(
      "Error while updating purchase inventory:",
      err?.message || err,
    );
  }
};

// Update inventory_stock table for comprehensive stock tracking
const updateInventoryStock = async (sequelize, data, quantity, options) => {
  try {
    const { v4: uuidv4 } = require("uuid");

    // For raw materials, use "RAW_INVENTORY" as unit_id
    const unitId = "RAW_INVENTORY";
    const productId = data.product_master_id;

    // Find existing inventory stock record
    let inventoryStock = await sequelize.models.InventoryStock.findOne({
      where: {
        product_id: productId,
        unit_id: unitId,
        lot_id: null, // Raw materials may not have specific lots initially
      },
    });

    const transaction = await sequelize.transaction();

    try {
      if (inventoryStock) {
        // Update existing stock
        const previousQty = inventoryStock.on_hand_qty;
        await inventoryStock.update(
          {
            on_hand_qty: quantity,
            available_qty: quantity, // Available = on_hand for raw materials
            updated_at: new Date(),
          },
          { transaction },
        );
      } else {
        // Create new stock record
        inventoryStock = await sequelize.models.InventoryStock.create(
          {
            id: uuidv4(),
            product_id: productId,
            unit_id: unitId,
            lot_id: null,
            on_hand_qty: quantity,
            available_qty: quantity,
            reserved_qty: 0,
            uom: "KG",
            cost_layer_id: null,
            last_transaction_id: null,
            updated_at: new Date(),
          },
          { transaction },
        );
      }

      // Create inventory transaction record
      await sequelize.models.InventoryTransaction.create(
        {
          id: uuidv4(),
          stock_id: inventoryStock.id,
          product_id: productId,
          transaction_type: "PRODUCTION_RECEIPT",
          qty_change: quantity,
          uom: "KG",
          warehouse_from: null,
          warehouse_to: unitId,
          reference_id: data.id, // Reference to procurement product
          reference_type: "PROCUREMENT_PRODUCT",
          batch_id: null,
          lot_id: null,
          cost_per_unit: data.procurement_price || 0,
          total_cost: (data.procurement_price || 0) * quantity,
          notes: `Purchase receipt for procurement product ${data.id}`,
          created_by: options?.profile_id,
          created_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.log("Error updating inventory stock:", err?.message || err);
    }
  } catch (err) {
    console.log("Error in updateInventoryStock:", err?.message || err);
  }
};
