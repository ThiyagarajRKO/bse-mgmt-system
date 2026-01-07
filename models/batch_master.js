"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BatchMaster extends Model {
    static associate(models) {
      BatchMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      BatchMaster.belongsTo(models.GradeMaster, {
        foreignKey: "grade_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      BatchMaster.belongsTo(models.SizeMaster, {
        foreignKey: "size_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      BatchMaster.hasMany(models.ProductionSchedule, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      BatchMaster.hasMany(models.QAChecklist, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      BatchMaster.hasMany(models.CartonMapping, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      BatchMaster.hasMany(models.TraceabilityMap, {
        foreignKey: "batch_id",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  BatchMaster.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      batch_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_form: {
        type: DataTypes.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      grade_id: {
        type: DataTypes.UUID,
      },
      size_id: {
        type: DataTypes.UUID,
      },
      input_quantity_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      input_unit: {
        type: DataTypes.STRING(50),
        defaultValue: "kg",
      },
      expected_yield_qty: {
        type: DataTypes.DECIMAL(10, 2),
      },
      actual_yield_qty: {
        type: DataTypes.DECIMAL(10, 2),
      },
      yield_variance_pct: {
        type: DataTypes.DECIMAL(5, 2),
      },
      batch_status: {
        type: DataTypes.ENUM(
          "CREATED",
          "IN_PRODUCTION",
          "YIELD_RECORDED",
          "QA_PENDING",
          "QA_APPROVED",
          "QA_REJECTED",
          "PACKED",
          "COMPLETED"
        ),
        defaultValue: "CREATED",
      },
      created_date: {
        type: DataTypes.DATE,
      },
      production_start_date: {
        type: DataTypes.DATE,
      },
      production_end_date: {
        type: DataTypes.DATE,
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
      tableName: "batch_master",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return BatchMaster;
};
