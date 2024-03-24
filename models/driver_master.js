"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DriverMaster extends Model {
    static associate(models) {
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      DriverMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
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
    }
  );

  return DriverMaster;
};
