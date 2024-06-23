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
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.SupplierMaster, {
        foreignKey: "supplier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
        type: DataTypes.FLOAT,
      },
      adjusted_quantity: {
        type: DataTypes.FLOAT,
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
    }
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
        err?.message || err
      );
    }
  });

  // Create Hook
  ProcurementProducts.afterCreate(async (data, options) => {
    updateInvenoryQuantity(sequelize, data);
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
        err?.message || err
      );
    }
  });

  // Update Hook
  ProcurementProducts.afterUpdate(async (data, options) => {
    updateInvenoryQuantity(sequelize, data);
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
        err?.message || err
      );
    }
  });

  return ProcurementProducts;
};

// Utils Functions
const updateInvenoryQuantity = async (sequelize, data) => {
  try {
    const procurementProduct =
      await sequelize.models.ProcurementProducts.findOne({
        subQuery: false,
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
              `(SELECT SUM(dispatch_quantity) FROM dispatches WHERE procurement_product_id = "ProcurementProducts".id and is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
        ],
        where: {
          product_master_id: data?.product_master_id,
          procurement_product_type: data?.procurement_product_type,
          is_active: true,
        },
        group: ["ProcurementProducts.id"],
        raw: true,
      });

    const inventoryData = await sequelize.models.PurchaseInventory.findOne({
      attributes: ["id"],
      where: {
        product_master_id: data?.product_master_id,
        procurement_product_type: data?.procurement_product_type,
        is_active: true,
      },
      raw: true,
    });

    const finalQuantity =
      (procurementProduct?.total_adjusted_quantity ||
        procurementProduct?.total_quantity) -
      procurementProduct?.total_dispatched_quantity;

    if (inventoryData?.id) {
      await sequelize.models.PurchaseInventory.update(
        {
          quantity: finalQuantity,
        },
        {
          where: {
            id: inventoryData?.id,
            is_active: true,
          },
        }
      ).catch(console.log);
    } else {
      await sequelize.models.PurchaseInventory.create({
        procurement_product_id: data?.id,
        product_master_id: data?.product_master_id,
        procurement_product_type: data?.procurement_product_type,
        quantity: procurementProduct?.total_adjusted_quantity
          ? procurementProduct?.total_adjusted_quantity
          : procurementProduct?.total_quantity,
        is_active: true,
        created_by: options?.profile_id,
      }).catch(console.log);
    }
  } catch (err) {
    console.log(
      "Error while inserting a procurements data",
      err?.message || err
    );
  }
};
