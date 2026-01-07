"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TraceabilityMap extends Model {
    static associate(models) {
      TraceabilityMap.belongsTo(models.SupplierMaster, {
        foreignKey: "supplier_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      TraceabilityMap.belongsTo(models.ProcurementLots, {
        foreignKey: "procurement_lot_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      TraceabilityMap.belongsTo(models.BatchMaster, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      TraceabilityMap.belongsTo(models.CartonMapping, {
        as: "carton",
        foreignKey: "carton_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      TraceabilityMap.belongsTo(models.CustomerMaster, {
        foreignKey: "customer_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      TraceabilityMap.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      TraceabilityMap.belongsTo(models.Invoice, {
        foreignKey: "invoice_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  TraceabilityMap.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      trace_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      supplier_id: {
        type: DataTypes.UUID,
      },
      vessel_name: {
        type: DataTypes.STRING(100),
      },
      procurement_lot_id: {
        type: DataTypes.UUID,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      carton_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
      },
      invoice_id: {
        type: DataTypes.UUID,
      },
      delivery_date: {
        type: DataTypes.DATE,
      },
      quality_status: {
        type: DataTypes.ENUM(
          "DELIVERED",
          "ACCEPTED",
          "REJECTED",
          "DAMAGED",
          "RETURNED"
        ),
        defaultValue: "DELIVERED",
      },
      trace_direction: {
        type: DataTypes.ENUM("FORWARD", "BACKWARD", "BIDIRECTIONAL"),
        defaultValue: "BIDIRECTIONAL",
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
      tableName: "traceability_map",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return TraceabilityMap;
};
