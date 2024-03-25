"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DriverMaster extends Model {
    static associate(models) {
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  DriverMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      driver_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      driver_profile_url: {
        type: DataTypes.TEXT,
      },
      license_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
      },
      aadhar_number: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      emergency_contact: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      blood_group: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      health_history: {
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
      modelName: "DriverMaster",
      tableName: "driver_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  // Create Hook
  DriverMaster.beforeCreate(async (data, options) => {
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
  DriverMaster.beforeUpdate(async (data, options) => {
    try {
      data.updated_at = new Date();
      data.updated_by = options?.profile_id;
    } catch (err) {
      console.log("Error while updating a driver", err?.message || err);
    }
  });

  // Delete Hook
  DriverMaster.afterDestroy(async (data, options) => {
    try {
      data.deleted_by = options?.profile_id;
      data.is_active = false;

      await data.save({ profile_id: options.profile_id });
    } catch (err) {
      console.log("Error while deleting a driver", err?.message || err);
    }
  });

  return DriverMaster;
};
