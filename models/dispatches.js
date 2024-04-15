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
    }
  );

  // Create Hook
  Dispatches.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while appending an dispatch data",
        err?.message || err
      );
    }
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
