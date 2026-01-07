"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class MaterialReservation extends Model {
    static associate(models) {
      MaterialReservation.belongsTo(models.AllocationMaster, {
        foreignKey: "allocation_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      MaterialReservation.belongsTo(models.SalesInventory, {
        foreignKey: "inventory_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  MaterialReservation.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      reservation_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      allocation_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      inventory_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reserved_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      reserved_unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      reservation_date: {
        type: DataTypes.DATE,
      },
      reservation_status: {
        type: DataTypes.ENUM(
          "RESERVED",
          "PARTIAL_FULFILLED",
          "FULFILLED",
          "CANCELLED",
          "EXPIRED"
        ),
        defaultValue: "RESERVED",
      },
      fulfilled_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      expiry_date: {
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
      tableName: "material_reservation",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return MaterialReservation;
};
