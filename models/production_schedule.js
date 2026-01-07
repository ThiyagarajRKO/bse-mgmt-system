"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductionSchedule extends Model {
    static associate(models) {
      ProductionSchedule.belongsTo(models.BatchMaster, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      ProductionSchedule.belongsTo(models.AllocationMaster, {
        foreignKey: "allocation_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      ProductionSchedule.belongsTo(models.UnitMaster, {
        foreignKey: "unit_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      ProductionSchedule.belongsTo(models.UserProfiles, {
        foreignKey: "assigned_to",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  ProductionSchedule.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      production_order_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      allocation_id: {
        type: DataTypes.UUID,
      },
      processing_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      scheduled_start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      scheduled_end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      actual_start_date: {
        type: DataTypes.DATE,
      },
      actual_end_date: {
        type: DataTypes.DATE,
      },
      production_status: {
        type: DataTypes.ENUM(
          "SCHEDULED",
          "IN_PROGRESS",
          "ON_HOLD",
          "COMPLETED",
          "CANCELLED"
        ),
        defaultValue: "SCHEDULED",
      },
      unit_id: {
        type: DataTypes.UUID,
      },
      assigned_to: {
        type: DataTypes.UUID,
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
      tableName: "production_schedule",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ProductionSchedule;
};
