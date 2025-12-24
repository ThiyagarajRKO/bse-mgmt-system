"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const JournalHeader = sequelize.define(
    "JournalHeader",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      journal_no: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      journal_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      posting_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      source_module: {
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
      source_document_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      source_document_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      source_document_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      event_code: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_debit: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total_credit: {
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
      status: {
        type: DataTypes.ENUM("DRAFT", "POSTED", "REVERSED", "ERROR"),
        allowNull: false,
        defaultValue: "DRAFT",
      },
      posted_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      posted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reversed_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reversed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reversal_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_system_generated: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: "journal_header",
      timestamps: true,
      paranoid: false,
    }
  );

  JournalHeader.associate = (models) => {
    JournalHeader.hasMany(models.JournalLines, {
      foreignKey: "journal_id",
      as: "journalLines",
    });
    JournalHeader.hasMany(models.PostingAuditLog, {
      foreignKey: "journal_id",
      as: "auditLogs",
    });
  };

  return JournalHeader;
};
