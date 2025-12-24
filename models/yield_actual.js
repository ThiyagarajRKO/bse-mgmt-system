"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class YieldActual extends Model {
    static associate(models) {
      // Define associations
      YieldActual.belongsTo(models.PackingList, {
        foreignKey: "packing_list_id",
        as: "packingList",
      });
      YieldActual.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });
    }
  }

  YieldActual.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      packing_list_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "packing_list",
          key: "id",
        },
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      product_form: {
        type: DataTypes.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      processing_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      raw_input_kg: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
      raw_cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      saleable_output_kg: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
      actual_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      expected_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      variance_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      loss_kg: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
      },
      loss_value: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("OK", "WARNING", "BREACH"),
        allowNull: false,
        defaultValue: "OK",
      },
      reason_codes: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      supervisor_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "YieldActual",
      tableName: "yield_actual",
      timestamps: true,
      paranoid: false,
    }
  );

  return YieldActual;
};
