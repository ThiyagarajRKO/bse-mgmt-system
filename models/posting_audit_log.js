"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PostingAuditLog = sequelize.define(
    "PostingAuditLog",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      journal_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "journal_header",
          key: "id",
        },
      },
      event_code: {
        type: DataTypes.STRING(30),
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
      posting_rule_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "posting_rule_master",
          key: "id",
        },
      },
      posting_rule_code: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      action: {
        type: DataTypes.ENUM(
          "POSTING_ATTEMPT",
          "POSTING_SUCCESS",
          "POSTING_FAILURE",
          "POSTING_REVERSE",
          "RULE_NOT_FOUND",
          "VALIDATION_ERROR"
        ),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILURE", "WARNING"),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      error_details: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      input_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      output_data: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      processing_time_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      user_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      session_id: {
        type: DataTypes.UUID,
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
      tableName: "posting_audit_log",
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ["journal_id"],
        },
        {
          fields: ["event_code"],
        },
        {
          fields: ["posting_rule_id"],
        },
        {
          fields: ["action"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  PostingAuditLog.associate = (models) => {
    PostingAuditLog.belongsTo(models.JournalHeader, {
      foreignKey: "journal_id",
      as: "journalHeader",
    });
    PostingAuditLog.belongsTo(models.PostingRuleMaster, {
      foreignKey: "posting_rule_id",
      as: "postingRule",
    });
  };

  return PostingAuditLog;
};
