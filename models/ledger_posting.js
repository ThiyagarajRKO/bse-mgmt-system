"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LedgerPosting extends Model {
    static associate(models) {
      LedgerPosting.belongsTo(models.JournalHeader, {
        foreignKey: "journal_header_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      LedgerPosting.belongsTo(models.ChartOfAccounts, {
        as: "account",
        foreignKey: "account_code",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      LedgerPosting.belongsTo(models.LedgerPosting, {
        as: "reversal",
        foreignKey: "reversal_posting_id",
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }
  }

  LedgerPosting.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      posting_no: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      source_type: {
        type: DataTypes.ENUM(
          "INVOICE",
          "INVENTORY",
          "DISPATCH",
          "MANUAL",
          "ADJUSTMENT"
        ),
        allowNull: false,
      },
      source_id: {
        type: DataTypes.UUID,
      },
      journal_header_id: {
        type: DataTypes.UUID,
      },
      account_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      debit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      credit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      currency_code: {
        type: DataTypes.STRING(3),
        defaultValue: "INR",
      },
      posting_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      reference_no: {
        type: DataTypes.STRING(50),
      },
      description: {
        type: DataTypes.TEXT,
      },
      posting_status: {
        type: DataTypes.ENUM("DRAFT", "POSTED", "REVERSED", "CANCELLED"),
        defaultValue: "DRAFT",
      },
      reversal_posting_id: {
        type: DataTypes.UUID,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: "ledger_posting",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return LedgerPosting;
};
