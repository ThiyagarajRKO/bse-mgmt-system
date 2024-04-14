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
        foreignKey: "procurement_lot_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      ProcurementProducts.belongsTo(models.VendorMaster, {
        foreignKey: "vendor_master_id",
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
      procurement_lot_date: {
        type: DataTypes.DATE,
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

  // Update Hook
  ProcurementProducts.beforeUpdate(async (data, options) => {
    try {
      data.procurement_totalamount =
        data.procurement_quantity * data.procurement_price;

      if (adjusted_quantity && data.adjusted_price)
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
