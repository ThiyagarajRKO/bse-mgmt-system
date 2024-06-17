"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PurchasePayments extends Model {
    static associate(models) {
      PurchasePayments.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PurchasePayments.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PurchasePayments.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PurchasePayments.belongsTo(models.SupplierMaster, {
        foreignKey: "supplier_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PurchasePayments.belongsTo(models.ProcurementLots, {
        foreignKey: "procurement_lot_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PurchasePayments.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      payment_method: {
        type: DataTypes.STRING,
      },
      discount: {
        type: DataTypes.FLOAT,
      },
      total_paid: {
        type: DataTypes.FLOAT,
      },
      net_amount: {
        type: DataTypes.FLOAT,
      },
      penality: {
        type: DataTypes.FLOAT,
      },
      tax_percentage: {
        type: DataTypes.FLOAT,
      },
      tax_amount: {
        type: DataTypes.FLOAT,
      },
      due_amount: {
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
      modelName: "PurchasePayments",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  PurchasePayments.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a purchase payment details",
        err?.message || err
      );
    }
  });

  // Update Hook
  PurchasePayments.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log(
        "Error while updating a purchase payment",
        err?.message || err
      );
    }
  });

  // Delete Hook
  PurchasePayments.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log(
        "Error while deleting a purchase payment",
        err?.message || err
      );
    }
  });

  return PurchasePayments;
};
