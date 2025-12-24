"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const JournalLines = sequelize.define(
    "JournalLines",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      journal_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "journal_header",
          key: "id",
        },
      },
      line_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      gl_account_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "chart_of_accounts",
          key: "id",
        },
      },
      gl_account_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      gl_account_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      debit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      credit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency_code: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
      },
      exchange_rate: {
        type: DataTypes.DECIMAL(10, 4),
        defaultValue: 1.0,
      },
      base_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      cost_center_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "cost_centers",
          key: "id",
        },
      },
      cost_center_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      profit_center_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "profit_centers",
          key: "id",
        },
      },
      profit_center_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      segment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "segments",
          key: "id",
        },
      },
      segment_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      business_partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      business_partner_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      business_partner_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      assignment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reference_key_1: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference_key_2: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      reference_key_3: {
        type: DataTypes.STRING(50),
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
      tableName: "journal_lines",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["journal_id"],
        },
        {
          fields: ["gl_account_id"],
        },
        {
          fields: ["cost_center_id"],
        },
        {
          fields: ["profit_center_id"],
        },
        {
          fields: ["segment_id"],
        },
        {
          fields: ["business_partner_id"],
        },
      ],
    }
  );

  JournalLines.associate = (models) => {
    JournalLines.belongsTo(models.JournalHeader, {
      foreignKey: "journal_id",
      as: "journalHeader",
    });
    JournalLines.belongsTo(models.ChartOfAccounts, {
      foreignKey: "gl_account_id",
      as: "glAccount",
    });
  };

  return JournalLines;
};
