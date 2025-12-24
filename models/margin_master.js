"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const MarginMaster = sequelize.define(
    "MarginMaster",
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
      product_form: {
        type: DataTypes.ENUM("FROZEN", "COOKED", "RTE", "FRESH"),
        allowNull: false,
      },
      market: {
        type: DataTypes.ENUM("DOMESTIC", "EXPORT", "RETAIL", "WHOLESALE"),
        allowNull: false,
      },
      target_margin_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      min_margin_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      yield_tolerance_pct: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 5.0,
      },
      auto_uplift_pct: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 10.0,
      },
      approval_required_pct: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 15.0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      effective_from: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      effective_to: {
        type: DataTypes.DATE,
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
      tableName: "margin_master",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["species_id", "product_form", "market"],
        },
        {
          fields: ["is_active", "effective_from", "effective_to"],
        },
      ],
    }
  );

  MarginMaster.associate = (models) => {
    MarginMaster.belongsTo(models.SpeciesMaster, {
      foreignKey: "species_id",
      as: "species",
    });
  };

  return MarginMaster;
};
