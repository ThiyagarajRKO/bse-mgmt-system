"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class OrderStatusLog extends Model {
    static associate(models) {
      OrderStatusLog.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  OrderStatusLog.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      from_status: {
        type: DataTypes.STRING(50),
      },
      to_status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "CONFIRMED",
          "ALLOCATED",
          "IN_PRODUCTION",
          "READY_FOR_QA",
          "QA_APPROVED",
          "PACKED",
          "READY_FOR_DISPATCH",
          "DISPATCHED",
          "INVOICED",
          "CLOSED",
          "CANCELLED"
        ),
        allowNull: false,
      },
      transition_date: {
        type: DataTypes.DATE,
      },
      transition_reason: {
        type: DataTypes.TEXT,
      },
      metadata: {
        type: DataTypes.JSONB,
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
      tableName: "order_status_log",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return OrderStatusLog;
};
