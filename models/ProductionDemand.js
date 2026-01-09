"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductionDemand extends Model {
    static associate(models) {
      // Belongs to SalesAllocation, ProductionOrder, ProductMaster
      if (models.SalesAllocation) {
        this.belongsTo(models.SalesAllocation, {
          foreignKey: "sales_allocation_id",
          as: "salesAllocation",
        });
      }

      if (models.ProductionOrder) {
        this.belongsTo(models.ProductionOrder, {
          foreignKey: "production_order_id",
          as: "productionOrder",
        });
      }

      if (models.ProductMaster) {
        this.belongsTo(models.ProductMaster, {
          foreignKey: "product_master_id",
          as: "productMaster",
        });
      }
    }
  }

  ProductionDemand.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      demand_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: "Unique demand identifier (DEM-YYYYMMDD-HHMMSS-XXXX)",
      },
      sales_allocation_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      production_order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Linked to production order when created",
      },
      product_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      demanded_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fulfilled_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      demand_status: {
        type: DataTypes.ENUM(
          "CREATED",
          "WAITING_FOR_PRODUCTION",
          "IN_PRODUCTION",
          "PRODUCTION_COMPLETE",
          "DISPATCHED",
          "FULFILLED"
        ),
        defaultValue: "CREATED",
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
        defaultValue: "MEDIUM",
      },
      required_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "Deadline for demand fulfillment",
      },
      remarks: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "ProductionDemand",
      tableName: "production_demands",
      timestamps: true,
      underscored: true,
    }
  );

  return ProductionDemand;
};
