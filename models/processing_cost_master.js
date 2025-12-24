"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProcessingCostMaster = sequelize.define(
    "ProcessingCostMaster",
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
      process_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      cost_per_kg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      currency_code: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
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
      tableName: "processing_cost_master",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["species_id", "process_type"],
        },
        {
          fields: ["is_active", "effective_from", "effective_to"],
        },
      ],
    }
  );

  ProcessingCostMaster.associate = (models) => {
    ProcessingCostMaster.belongsTo(models.SpeciesMaster, {
      foreignKey: "species_id",
      as: "species",
    });
  };

  return ProcessingCostMaster;
};
