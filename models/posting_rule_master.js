"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PostingRuleMaster = sequelize.define(
    "PostingRuleMaster",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      rule_code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      rule_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      event_code: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      module: {
        type: DataTypes.ENUM(
          "INVENTORY",
          "SALES",
          "PURCHASE",
          "PRODUCTION",
          "GST",
          "YIELD",
          "MANUAL"
        ),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      conditions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      debit_account_mappings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      credit_account_mappings: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      posting_logic: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
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
      tableName: "posting_rule_master",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["event_code"],
        },
        {
          fields: ["module"],
        },
        {
          fields: ["is_active"],
        },
        {
          fields: ["priority"],
        },
        {
          fields: ["effective_from", "effective_to"],
        },
      ],
    }
  );

  PostingRuleMaster.associate = (models) => {
    // Add associations if needed
  };

  return PostingRuleMaster;
};
