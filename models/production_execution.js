"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ProductionExecution extends Model {
    static associate(models) {
      // Define associations
      ProductionExecution.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });
      ProductionExecution.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
        as: "derivative",
      });
    }
  }

  ProductionExecution.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "derivative_master",
          key: "id",
        },
      },
      raw_input_weight_kg: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      finished_output_weight_kg: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      finished_output_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      expected_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      actual_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      yield_variance_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("PASS", "HOLD", "FAIL"),
        allowNull: false,
        defaultValue: "PASS",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      modelName: "ProductionExecution",
      tableName: "production_execution",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["species_id", "derivative_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
      ],
    },
  );

  return ProductionExecution;
};
