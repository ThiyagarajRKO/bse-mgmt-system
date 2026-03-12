"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AccountingAuditTrail extends Model {
    static associate(models) {
      AccountingAuditTrail.belongsTo(models.JournalEntry, {
        as: "journal_entry",
        foreignKey: "journal_entry_id",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });

      AccountingAuditTrail.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  AccountingAuditTrail.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      journal_entry_id: {
        type: DataTypes.UUID,
      },
      module: {
        type: DataTypes.ENUM(
          "PROCUREMENT",
          "INVENTORY",
          "PRODUCTION",
          "QA",
          "PACKING",
          "DISPATCH",
          "SALES",
          "PAYMENTS",
          "MANUAL",
        ),
      },
      action: {
        type: DataTypes.ENUM(
          "CREATE",
          "UPDATE",
          "DELETE",
          "POST",
          "REVERSE",
          "APPROVE",
          "REJECT",
        ),
      },
      reference_id: {
        type: DataTypes.UUID,
      },
      reference_type: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      old_values: {
        type: DataTypes.JSONB,
      },
      new_values: {
        type: DataTypes.JSONB,
      },
      ip_address: {
        type: DataTypes.STRING,
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "AccountingAuditTrail",
      tableName: "accounting_audit_trail",
      underscored: true,
      createdAt: false,
      updatedAt: false,
    },
  );

  // Hooks
  AccountingAuditTrail.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
      data.created_at = new Date();
    } catch (err) {
      throw err;
    }
  });

  return AccountingAuditTrail;
};
