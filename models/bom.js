"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const BomMaster = sequelize.define(
    "BomMaster",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      bom_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      bom_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      input_uom: {
        type: DataTypes.STRING(50),
        defaultValue: "KG",
      },
      output_uom: {
        type: DataTypes.STRING(50),
        defaultValue: "KG",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "bom_master",
      timestamps: true,
      underscored: true,
    },
  );

  const BomInput = sequelize.define(
    "BomInput",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      raw_product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 1,
      },
      uom: {
        type: DataTypes.STRING(50),
        defaultValue: "KG",
      },
    },
    {
      tableName: "bom_input",
      timestamps: true,
      underscored: true,
    },
  );

  const BomOutput = sequelize.define(
    "BomOutput",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      derivative_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      base_yield_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      loss_type: {
        type: DataTypes.ENUM("WASTE", "EVAPORATION", "TRIM"),
        defaultValue: "WASTE",
      },
    },
    {
      tableName: "bom_output",
      timestamps: true,
      underscored: true,
    },
  );

  const DerivativeGradeSizeRule = sequelize.define(
    "DerivativeGradeSizeRule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      derivative_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      size_min_grams: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      size_max_grams: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      allowed_grades: {
        type: DataTypes.JSON,
        defaultValue: ["A", "B", "C", "D"],
      },
      yield_multiplier: {
        type: DataTypes.DECIMAL(5, 3),
        defaultValue: 1.0,
      },
    },
    {
      tableName: "derivative_grade_size_rule",
      timestamps: true,
      underscored: true,
    },
  );

  const BomCost = sequelize.define(
    "BomCost",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      bom_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      cost_type: {
        type: DataTypes.ENUM("LABOUR", "PACKAGING", "ENERGY", "OVERHEAD"),
        allowNull: false,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
      },
    },
    {
      tableName: "bom_cost",
      timestamps: true,
      underscored: true,
    },
  );

  // Associations
  BomMaster.hasMany(BomInput, { foreignKey: "bom_id", as: "inputs" });
  BomInput.belongsTo(BomMaster, { foreignKey: "bom_id" });

  BomMaster.hasMany(BomOutput, { foreignKey: "bom_id", as: "outputs" });
  BomOutput.belongsTo(BomMaster, { foreignKey: "bom_id" });

  BomMaster.hasMany(BomCost, { foreignKey: "bom_id", as: "costs" });
  BomCost.belongsTo(BomMaster, { foreignKey: "bom_id" });

  // Return only the primary BomMaster model
  // Other models will be loaded separately from their own files
  return BomMaster;
};
