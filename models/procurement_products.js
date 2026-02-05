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
    updateInvenoryQuantity(sequelize, data, options);
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
    // Get all active procurement products for this product and type
    const allProcurementProducts =
      await sequelize.models.ProcurementProducts.findAll({
        subQuery: false,
        attributes: ["id", "procurement_quantity", "adjusted_quantity"],
        where: {
          product_master_id: data?.product_master_id,
          procurement_product_type: data?.procurement_product_type,
          is_active: true,
        },
        raw: true,
      });

    // Calculate totals manually to avoid grouping issues
    let total_quantity = 0;
    let total_adjusted_quantity = 0;

    for (const pp of allProcurementProducts) {
      total_quantity += pp.procurement_quantity || 0;
      total_adjusted_quantity += pp.adjusted_quantity || 0;
    }

    // Get dispatched quantity for all these procurement products
    const dispatchedData = await sequelize.models.Dispatches.findAll({
      attributes: [
        [
          sequelize.fn("sum", sequelize.col("dispatch_quantity")),
          "total_dispatched",
        ],
      ],
      where: {
        procurement_product_id: allProcurementProducts.map((p) => p.id),
        is_active: true,
      },
      raw: true,
    });

    const total_dispatched_quantity = dispatchedData[0]?.total_dispatched || 0;

    const finalQuantity = Math.floor(
      (total_adjusted_quantity > 0 ? total_adjusted_quantity : total_quantity) -
        (total_dispatched_quantity || 0),
    );

    console.log(
      `Updating purchase inventory for product ${data?.product_master_id}, type: ${data?.procurement_product_type}, finalQuantity: ${finalQuantity}`,
    );

    const inventoryData = await sequelize.models.PurchaseInventory.findOne({
      attributes: ["id", "quantity"],
      where: {
        product_master_id: data?.product_master_id,
        procurement_product_type: data?.procurement_product_type,
        is_active: true,
      },
      raw: true,
    });

    if (inventoryData?.id) {
      console.log(
        `Updating existing purchase inventory ${inventoryData.id} from quantity ${inventoryData.quantity} to ${finalQuantity}`,
      );
      await sequelize.models.PurchaseInventory.update(
        {
          quantity: finalQuantity,
          updated_at: new Date(),
          updated_by: options?.profile_id,
        },
        {
          where: {
            id: inventoryData?.id,
            is_active: true,
          },
        },
      ).catch((err) => {
        console.error(
          "Error updating purchase inventory:",
          err?.message || err,
        );
      });
    } else {
      console.log(
        `Creating new purchase inventory for product ${data?.product_master_id} with quantity ${finalQuantity}`,
      );
      const { v4: uuidv4 } = require("uuid");
      await sequelize.models.PurchaseInventory.create({
        id: uuidv4(),
        procurement_product_id: data?.id,
        product_master_id: data?.product_master_id,
        procurement_product_type: data?.procurement_product_type,
        quantity: finalQuantity,
        is_active: true,
        created_by: options?.profile_id,
      }).catch((err) => {
        console.error(
          "Error creating purchase inventory:",
          err?.message || err,
        );
      });
    }

    // Update inventory_stock for comprehensive stock tracking
    await updateInventoryStock(sequelize, data, finalQuantity, options);
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
