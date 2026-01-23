"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AllocationMaster extends Model {
    static associate(models) {
      AllocationMaster.belongsTo(models.Orders, {
        foreignKey: "order_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      AllocationMaster.belongsTo(models.OrderProducts, {
        foreignKey: "order_product_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      AllocationMaster.belongsTo(models.Packing, {
        foreignKey: "packing_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      AllocationMaster.hasMany(models.MaterialReservation, {
        foreignKey: "allocation_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      AllocationMaster.hasMany(models.ProductionSchedule, {
        foreignKey: "allocation_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  AllocationMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      allocation_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      order_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      packing_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      allocated_quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      allocated_unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      allocation_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.ENUM(
          "ALLOCATED",
          "RESERVED",
          "CONFIRMED",
          "IN_PRODUCTION",
          "COMPLETED",
          "CANCELLED",
        ),
        defaultValue: "ALLOCATED",
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
      tableName: "allocation_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return AllocationMaster;
};
