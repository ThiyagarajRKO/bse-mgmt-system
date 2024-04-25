"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CustomerMaster extends Model {
    static associate(models) {
      CustomerMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CustomerMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      CustomerMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  CustomerMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      customer_name: {
        type: DataTypes.STRING(100),
      },
      customer_address: {
        type: DataTypes.TEXT,
      },
      customer_country: {
        type: DataTypes.STRING(100),
      },
      customer_phone: {
        type: DataTypes.STRING(25),
      },
      customer_email: {
        type: DataTypes.STRING(100),
      },
      customer_paymentterms: {
        type: DataTypes.STRING(100),
      },
      customer_credit: {
        type: DataTypes.STRING,
      },
      customer_type: {
        type: DataTypes.STRING(100),
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
      modelName: "CustomerMaster",
      tableName: "customer_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  CustomerMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a customer details",
        err?.message || err
      );
    }
  });

  // Update Hook
  CustomerMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a customer", err?.message || err);
    }
  });

  // Delete Hook
  CustomerMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a customer", err?.message || err);
    }
  });

  return CustomerMaster;
};
