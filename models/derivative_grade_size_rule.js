"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DerivativeGradeSizeRule extends Model {
    static associate(models) {
      // Association with SpeciesMaster
      DerivativeGradeSizeRule.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_id",
        onDelete: "CASCADE",
      });
    }
  }

  DerivativeGradeSizeRule.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
      },
      derivative_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      size_min_grams: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      size_max_grams: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      allowed_grades: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'JSON array of allowed grades e.g., ["A", "B", "C"]',
      },
      yield_multiplier: {
        type: DataTypes.DECIMAL(5, 3),
        defaultValue: 1.0,
        comment:
          "Yield multiplier for this grade/size combination (1.0 = no adjustment)",
      },
    },
    {
      sequelize,
      modelName: "DerivativeGradeSizeRule",
      tableName: "derivative_grade_size_rule",
      timestamps: true,
      underscored: true,
    }
  );

  return DerivativeGradeSizeRule;
};
