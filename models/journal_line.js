"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JournalLine extends Model {
    static associate(models) {
      JournalLine.belongsTo(models.JournalEntry, {
        as: "journal_entry",
        foreignKey: "journal_entry_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      JournalLine.belongsTo(models.ChartOfAccounts, {
        as: "account",
        foreignKey: "account_id",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });

      JournalLine.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      JournalLine.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      JournalLine.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  JournalLine.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      journal_entry_id: {
        type: DataTypes.UUID,
      },
      account_id: {
        type: DataTypes.UUID,
      },
      debit: {
        type: DataTypes.DECIMAL(18, 2),
      },
      credit: {
        type: DataTypes.DECIMAL(18, 2),
      },
      currency: {
        type: DataTypes.STRING,
      },
      line_description: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "JournalLine",
      tableName: "journal_line",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Hooks
  JournalLine.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
      data.is_active = true;
    } catch (err) {
      throw err;
    }
  });

  JournalLine.beforeUpdate(async (data, options) => {
    try {
      data.updated_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  JournalLine.beforeDestroy(async (data, options) => {
    try {
      data.deleted_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  return JournalLine;
};
