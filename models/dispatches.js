"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Dispatches extends Model {
    static associate(models) {
      Dispatches.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.ProcurementProducts, {
        as: "pp",
        foreignKey: "procurement_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.UnitMaster, {
        foreignKey: "unit_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.VehicleMaster, {
        foreignKey: "vehicle_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.DriverMaster, {
        foreignKey: "driver_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      Dispatches.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      Dispatches.hasMany(models.Peeling, {
        foreignKey: "dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  Dispatches.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      dispatch_quantity: {
        type: DataTypes.FLOAT,
      },
      temperature: {
        type: DataTypes.FLOAT,
      },
      delivery_status: {
        type: DataTypes.STRING,
      },
      delivery_notes: {
        type: DataTypes.TEXT,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Reference to the sales order for which this dispatch is made",
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
      modelName: "Dispatches",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Create Hook
  Dispatches.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an dispatch data",
        err?.message || err,
      );
    }
  });

  // Create Hook
  Dispatches.afterCreate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
  });

  // Update Hook
  Dispatches.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options.profile_id;
    } catch (err) {
      console.log("Error while updating an dispatch data", err?.message || err);
    }
  });

  // Update Hook
  Dispatches.afterUpdate(async (data, options) => {
    updateInventoryQuantity(sequelize, data, options);
    updateInventoryStock(sequelize, data, options);
  });

  // Delete Hook
  Dispatches.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting an dispatch data", err?.message || err);
    }
  });

  return Dispatches;
};

const updateInventoryQuantity = async (sequelize, data, options) => {
  try {
    const procurementProductData =
      await sequelize.models.ProcurementProducts.findOne({
        attributes: ["product_master_id", "procurement_product_type"],
        where: {
          id: data?.procurement_product_id,
          is_active: true,
        },
        raw: true,
      });

    const procurementProduct =
      await sequelize.models.ProcurementProducts.findOne({
        attributes: [
          [
            sequelize.fn("sum", sequelize.col("procurement_quantity")),
            "total_quantity",
          ],
          [
            sequelize.fn("sum", sequelize.col("adjusted_quantity")),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dp.dispatch_quantity) FROM dispatches dp WHERE dp.procurement_product_id = "ProcurementProducts".id and dp.is_active = true)`,
            ),
            "total_dispatched_quantity",
          ],
        ],
        where: {
          product_master_id: procurementProductData?.product_master_id,
          procurement_product_type:
            procurementProductData?.procurement_product_type,
          is_active: true,
        },
        group: ["ProcurementProducts.id"],
        raw: true,
      });

    const finalQuantity =
      (procurementProduct?.total_adjusted_quantity ||
        procurementProduct?.total_quantity) -
      procurementProduct?.total_dispatched_quantity;

    await sequelize.models.PurchaseInventory.update(
      {
        quantity: finalQuantity,
        updated_at: new Date(),
        updated_by: options?.profile_id,
      },
      {
        where: {
          product_master_id: procurementProductData?.product_master_id,
          procurement_product_type:
            procurementProductData?.procurement_product_type,
          is_active: true,
        },
      },
    ).catch(console.log);
  } catch (err) {
    console.log(
      "Error while inserting a procurements data",
      err?.message || err,
    );
  }
};

// Update inventory_stock table when dispatches are made
const updateInventoryStock = async (sequelize, data, options) => {
  try {
    const procurementProductData =
      await sequelize.models.ProcurementProducts.findOne({
        attributes: ["product_master_id", "procurement_product_type"],
        where: {
          id: data?.procurement_product_id,
          is_active: true,
        },
        raw: true,
      });

    if (!procurementProductData) return;

    const productId = procurementProductData.product_master_id;
    const unitId = "RAW_INVENTORY"; // Raw materials use RAW_INVENTORY unit

    // Find existing inventory stock record
    let inventoryStock = await sequelize.models.InventoryStock.findOne({
      where: {
        product_id: productId,
        unit_id: unitId,
        lot_id: null, // Raw materials may not have specific lots
      },
    });

    // Get updated purchase inventory quantity
    const purchaseInventory = await sequelize.models.PurchaseInventory.findOne({
      attributes: ["quantity", "available_quantity"],
      where: {
        product_master_id: productId,
        procurement_product_type:
          procurementProductData.procurement_product_type,
        is_active: true,
      },
      raw: true,
    });

    const availableQuantity = parseFloat(
      purchaseInventory?.available_quantity || 0,
    );

    const transaction = await sequelize.transaction();

    try {
      if (inventoryStock) {
        // Update existing stock
        await inventoryStock.update(
          {
            on_hand_qty: availableQuantity,
            available_qty: availableQuantity,
            updated_at: new Date(),
            updated_by: options?.profile_id,
          },
          { transaction },
        );
      } else {
        // Create new stock record
        const { v4: uuidv4 } = require("uuid");
        inventoryStock = await sequelize.models.InventoryStock.create(
          {
            id: uuidv4(),
            product_id: productId,
            unit_id: unitId,
            lot_id: null,
            on_hand_qty: availableQuantity,
            available_qty: availableQuantity,
            reserved_qty: 0,
            damaged_qty: 0,
            is_active: true,
            created_by: options?.profile_id,
          },
          { transaction },
        );
      }

      // Create inventory transaction record for dispatch
      await sequelize.models.InventoryTransaction.create(
        {
          id: require("uuid").v4(),
          stock_id: inventoryStock.id,
          product_id: productId,
          transaction_type: "DISPATCH",
          qty_change: -data.dispatch_quantity, // Negative for dispatch (reduction)
          uom: "KG",
          warehouse_from: unitId,
          warehouse_to: null,
          reference_id: data.id, // Reference to dispatch
          reference_type: "DISPATCH",
          batch_id: null,
          lot_id: null,
          cost_per_unit: 0, // Cost tracking for dispatches
          total_cost: 0,
          notes: `Dispatch of ${data.dispatch_quantity}kg for procurement product ${data.procurement_product_id}`,
          created_by: options?.profile_id,
          created_at: new Date(),
        },
        { transaction },
      );

      await transaction.commit();

      console.log(
        `✅ Updated inventory stock for dispatched product ${productId}: ${availableQuantity} units remaining`,
      );
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating inventory stock after dispatch:", error);
      throw error;
    }
  } catch (err) {
    console.log(
      "Error while updating inventory stock after dispatch",
      err?.message || err,
    );
  }
};
