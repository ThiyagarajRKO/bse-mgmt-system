"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PackagingMaster extends Model {
    static associate(models) {
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "creator_profile",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "updater_profile",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
      PackagingMaster.belongsTo(models.UserProfiles, {
        as: "deleter_profile",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  PackagingMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },

      packaging_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      packaging_type: {
        type: DataTypes.TEXT,
      },
      packaging_height: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      packaging_width: {
        type: DataTypes.TEXT,
      },
      packaging_length: {
        type: DataTypes.STRING(12),
        allowNull: false,
      },
      packaging_material_composition: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      packaging_supplier: {
        type: DataTypes.STRING(50),
        allowNull: false,
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
      modelName: "PackagingMaster",
      tableName: "packaging_master",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  );

  return PackagingMaster;
};
