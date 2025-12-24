"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class YieldStandardMaster extends Model {
    static associate(models) {
      // Define associations
      YieldStandardMaster.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        as: "species",
      });
    }
  }

  YieldStandardMaster.init(
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
      processing_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      expected_yield_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      allowed_variance_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.0,
      },
      min_yield_threshold: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      max_yield_threshold: {
        type: DataTypes.DECIMAL(5, 2),
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
      modelName: "YieldStandardMaster",
      tableName: "yield_standard_master",
      timestamps: true,
      paranoid: false,
    }
  );

  return YieldStandardMaster;
};
