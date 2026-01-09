"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductionRawIssue = sequelize.define(
    "production_raw_issues",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      production_order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      inventory_lot_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      issued_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      measured_avg_size_kg: {
        type: DataTypes.DECIMAL(8, 3),
        allowNull: false,
        comment: "Immutable - captured at issuance time",
      },
      size_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Mapped from size_master",
      },
      initial_grade: {
        type: DataTypes.ENUM("A", "B", "C", "D"),
        allowNull: false,
        comment: "Grade at time of issue",
      },
      grade_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "True = cannot change grade after issuance",
      },
      size_locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "True = cannot change size after issuance",
      },
      is_expired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_qc_failed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      issued_by: DataTypes.UUID,
      issued_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      remarks: DataTypes.TEXT,
    },
    {
      tableName: "production_raw_issues",
      timestamps: true,
      underscored: true,
    }
  );

  ProductionRawIssue.associate = (models) => {
    ProductionRawIssue.belongsTo(models.production_orders, {
      foreignKey: "production_order_id",
      as: "production_order",
    });
    ProductionRawIssue.belongsTo(models.inventory_master, {
      foreignKey: "inventory_lot_id",
      as: "inventory_lot",
    });
  };

  return ProductionRawIssue;
};
