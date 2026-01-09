"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SpeciesGroupDerivativeRule extends Model {
    static associate(models) {
      // Association with SpeciesMaster (represents species group)
      this.belongsTo(models.SpeciesMaster, {
        foreignKey: "species_group_id",
        as: "SpeciesGroup",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      // Association with DerivativeMaster
      this.belongsTo(models.DerivativeMaster, {
        foreignKey: "derivative_id",
        as: "Derivative",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }

  SpeciesGroupDerivativeRule.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      species_group_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "species_master",
          key: "id",
        },
        comment: "Reference to species_master (species group like ROUND_FISH)",
      },
      derivative_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "derivative_master",
          key: "id",
        },
        comment: "Reference to derivative_master",
      },
      pieces_per_unit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        validate: {
          isInt: true,
          min: 1,
        },
        comment:
          "Number of pieces this derivative produces per unit (e.g., 2 fillets per round fish)",
      },
      yield_min: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
        comment: "Minimum yield percentage (0-100)",
      },
      yield_max: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 0,
          max: 100,
        },
        comment: "Maximum yield percentage (0-100)",
      },
      priority_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 99,
        validate: {
          isInt: true,
        },
        comment:
          "Priority order for processing (lower = higher priority). 99 = waste",
      },
      loss_category: {
        type: DataTypes.ENUM("PRIMARY", "SECONDARY", "TRIM", "WASTE"),
        allowNull: true,
        defaultValue: "WASTE",
        comment: "Category of output (PRIMARY/SECONDARY/TRIM/WASTE)",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "SpeciesGroupDerivativeRule",
      tableName: "species_group_derivative_rule",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          fields: ["species_group_id"],
          name: "idx_species_group_derivative_rule_species_group_id",
        },
        {
          fields: ["derivative_id"],
          name: "idx_species_group_derivative_rule_derivative_id",
        },
        {
          fields: ["species_group_id", "derivative_id"],
          name: "idx_species_group_derivative_rule_composite",
          unique: true,
        },
        {
          fields: ["priority_order"],
          name: "idx_species_group_derivative_rule_priority",
        },
      ],
    }
  );

  return SpeciesGroupDerivativeRule;
};
