"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DispatchItems extends Model {
    static associate(models) {
      DispatchItems.belongsTo(models.Dispatches, {
        foreignKey: "dispatch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      DispatchItems.belongsTo(models.CartonMapping, {
        as: "carton",
        foreignKey: "carton_mapping_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      DispatchItems.belongsTo(models.BatchMaster, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      DispatchItems.belongsTo(models.ProductMaster, {
        foreignKey: "product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  DispatchItems.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      dispatch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      carton_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      carton_mapping_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      net_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      gross_weight_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      item_status: {
        type: DataTypes.ENUM(
          "READY",
          "LOADED",
          "IN_TRANSIT",
          "DELIVERED",
          "DAMAGED"
        ),
        defaultValue: "READY",
      },
      load_date: {
        type: DataTypes.DATE,
      },
      delivery_date: {
        type: DataTypes.DATE,
      },
      remarks: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: "dispatch_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return DispatchItems;
};
