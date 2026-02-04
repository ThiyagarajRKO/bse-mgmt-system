"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SalesInventory extends Model {
    static associate(models) {
      SalesInventory.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  SalesInventory.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      product_master_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      packing_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.FLOAT,
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
      modelName: "SalesInventory",
      tableName: "sales_inventory",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Create Hook
  SalesInventory.afterCreate(async (data, options) => {
    updateInventoryStock(sequelize, data, options);
  });

  // Update Hook
  SalesInventory.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating sales inventory data",
        err?.message || err,
      );
    }
  });

  // Update Hook
  SalesInventory.afterUpdate(async (data, options) => {
    updateInventoryStock(sequelize, data, options);
  });

  // Delete Hook
  SalesInventory.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting sales inventory data",
        err?.message || err,
      );
    }
  });

  return SalesInventory;
};

// Update inventory_stock table for comprehensive stock tracking
const updateInventoryStock = async (sequelize, data, options) => {
  try {
    const { v4: uuidv4 } = require("uuid");

    // For finished goods, use "FINISHED_GOODS" as unit_id or get from packing
    let unitId = "FINISHED_GOODS";
    const productId = data.product_master_id;

    // If we have packing info, try to get the unit from packing
    if (data.packing_id) {
      const packing = await sequelize.models.Packing.findByPk(data.packing_id, {
        attributes: ["unit_master_id"],
        raw: true,
      });
      if (packing?.unit_master_id) {
        unitId = packing.unit_master_id;
      }
    }

    // Find existing inventory stock record
    let inventoryStock = await sequelize.models.InventoryStock.findOne({
      where: {
        product_id: productId,
        unit_id: unitId,
        lot_id: data.packing_id || null, // Use packing_id as lot for finished goods
      },
    });

    // Calculate total sales inventory for this product
    const totalSalesInventory = await sequelize.models.SalesInventory.findOne({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      where: {
        product_master_id: productId,
        is_active: true,
      },
      raw: true,
    });

    const totalQuantity = parseFloat(totalSalesInventory?.total_quantity || 0);

    const transaction = await sequelize.transaction();

    try {
      if (inventoryStock) {
        // Update existing stock
        await inventoryStock.update(
          {
            on_hand_qty: totalQuantity,
            available_qty: totalQuantity, // Available = on_hand for finished goods
            updated_at: new Date(),
            updated_by: options?.profile_id,
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
            lot_id: data.packing_id || null,
            on_hand_qty: totalQuantity,
            available_qty: totalQuantity,
            reserved_qty: 0,
            damaged_qty: 0,
            is_active: true,
            created_by: options?.profile_id,
          },
          { transaction },
        );
      }

      // Create inventory transaction record for sales inventory update
      await sequelize.models.InventoryTransaction.create(
        {
          id: uuidv4(),
          stock_id: inventoryStock.id,
          product_id: productId,
          transaction_type: "ADJUSTMENT", // Sales inventory updates are adjustments
          qty_change: totalQuantity - (inventoryStock?.on_hand_qty || 0), // Net change
          uom: "KG",
          warehouse_from: null,
          warehouse_to: unitId,
          reference_id: data.id, // Reference to sales inventory record
          reference_type: "SALES_INVENTORY",
          batch_id: null,
          lot_id: data.packing_id || null,
          cost_per_unit: 0,
          total_cost: 0,
          notes: `Sales inventory update for packing ${data.packing_id}`,
          created_by: options?.profile_id,
          created_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();

      console.log(
        `✅ Updated inventory stock for product ${productId}: ${totalQuantity} units`,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating inventory stock:", error);
      throw error;
    }
  } catch (err) {
    console.log(
      "Error while updating inventory stock from sales inventory",
      err?.message || err,
    );
  }
};
