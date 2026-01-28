"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SalesAllocation extends Model {
    static associate(models) {
      // Belongs to Order and OrderProduct
      if (models.Orders) {
        this.belongsTo(models.Orders, {
          foreignKey: "order_id",
          as: "order",
        });
      }

      if (models.OrderProducts) {
        this.belongsTo(models.OrderProducts, {
          foreignKey: "order_product_id",
          as: "orderProduct",
        });
      }

      // Has many ProductionDemands
      if (models.ProductionDemand) {
        this.hasMany(models.ProductionDemand, {
          foreignKey: "sales_allocation_id",
          as: "productionDemands",
        });
      }
    }
  }

  SalesAllocation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      allocation_status: {
        type: DataTypes.ENUM(
          "PENDING",
          "ALLOCATED",
          "PRODUCTION_IN_PROGRESS",
          "COMPLETED",
        ),
        defaultValue: "PENDING",
        allowNull: false,
      },
      allocated_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fulfilled_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      ordered_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      allocation_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      allocated_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "user_profiles",
          key: "id",
        },
      },
      action_required: {
        type: DataTypes.ENUM(
          "DISPATCH",
          "BEGIN_PRODUCTION",
          "RAISE_PURCHASE_REQUEST",
        ),
        allowNull: true,
      },
      inventory_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "SalesAllocation",
      tableName: "sales_allocations",
      timestamps: true,
      underscored: true,
    },
  );

  return SalesAllocation;
};
