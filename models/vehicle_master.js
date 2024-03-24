"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class VehicleMaster extends Model {
    static associate(models) {
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      VehicleMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
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
    }
  );

  return VehicleMaster;
};
