"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductionOrder = sequelize.define(
    "production_orders",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      order_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },
      order_type: {
        type: DataTypes.ENUM("PRIMARY", "SECONDARY", "VALUE_ADDED", "REWORK"),
        defaultValue: "PRIMARY",
      },
      plant_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment:
          "Reference to the sales order this production order is created from",
      },
      input_species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      planned_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      planned_start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "PLANNED",
          "RAW_ISSUED",
          "IN_PRODUCTION",
          "COMPLETED",
          "CLOSED",
          "CANCELLED"
        ),
        defaultValue: "PLANNED",
      },
      issued_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      produced_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      wastage_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      yield_variance_percent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      created_by: DataTypes.UUID,
      approved_by: DataTypes.UUID,
      closed_by: DataTypes.UUID,
      closed_at: DataTypes.DATE,
      remarks: DataTypes.TEXT,
    },
    {
      tableName: "production_orders",
      timestamps: true,
      underscored: true,
    }
  );

  ProductionOrder.associate = (models) => {
    ProductionOrder.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "sales_order",
      onDelete: "SET NULL",
    });
    ProductionOrder.belongsTo(models.species_master, {
      foreignKey: "input_species_id",
      as: "input_species",
    });
    ProductionOrder.hasOne(models.production_raw_issues, {
      foreignKey: "production_order_id",
      as: "raw_issue",
      onDelete: "CASCADE",
    });
    ProductionOrder.hasMany(models.production_derivatives, {
      foreignKey: "production_order_id",
      as: "derivatives",
      onDelete: "CASCADE",
    });
    ProductionOrder.hasMany(models.production_outputs, {
      foreignKey: "production_order_id",
      as: "outputs",
      onDelete: "CASCADE",
    });
    ProductionOrder.hasMany(models.grade_size_validation_logs, {
      foreignKey: "production_order_id",
      as: "validation_logs",
      onDelete: "CASCADE",
    });
  };

  return ProductionOrder;
};
