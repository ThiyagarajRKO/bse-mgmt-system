"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class VendorMaster extends Model {
    static associate(models) {
      VendorMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      VendorMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      VendorMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      VendorMaster.belongsTo(models.LocationMaster, {
        foreignKey: "location_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  VendorMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      vendor_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      vendor_profile_url: {
        type: DataTypes.TEXT,
      },
      address: {
        type: DataTypes.TEXT,
      },
      representative: {
        type: DataTypes.STRING(100),
      },
      phone: {
        type: DataTypes.STRING(25),
      },
      email: {
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
      modelName: "VendorMaster",
      tableName: "vendor_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  return VendorMaster;
};
