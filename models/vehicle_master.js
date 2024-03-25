"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class VehicleMaster extends Model {
    static associate(models) {
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  VehicleMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      vehicle_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      vehicle_brand: {
        type: DataTypes.STRING,
      },
      model_number: {
        type: DataTypes.STRING,
      },
      insurance_provider: {
        type: DataTypes.STRING,
      },
      insurance_number: {
        type: DataTypes.STRING,
      },
      insurance_expiring_on: {
        type: DataTypes.DATE,
      },
      last_fc_date: {
        type: DataTypes.DATE,
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
      modelName: "VehicleMaster",
      tableName: "vehicle_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  VehicleMaster.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
    } catch (err) {
      console.log(
        "Error while inserting a driver details",
        err?.message || err
      );
    }
  });

  // Update Hook
  VehicleMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a driver", err?.message || err);
    }
  });

  // Delete Hook
  VehicleMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a driver", err?.message || err);
    }
  });

  return VehicleMaster;
};
