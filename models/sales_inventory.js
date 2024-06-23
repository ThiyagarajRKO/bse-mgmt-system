"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SalesInventory extends Model {
    static associate(models) {
      SalesInventory.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.ProductMaster, {
        foreignKey: "product_master_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      SalesInventory.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }
  SalesInventory.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      quantity: {
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
      modelName: "SalesInventory",
      tableName: "sales_inventory",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    }
  );

  return SalesInventory;
};
