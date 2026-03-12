"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JournalEntry extends Model {
    static associate(models) {
      JournalEntry.hasMany(models.JournalLine, {
        as: "lines",
        foreignKey: "journal_entry_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      JournalEntry.belongsTo(models.UserProfiles, {
        as: "creator",
        foreignKey: "created_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      JournalEntry.belongsTo(models.UserProfiles, {
        as: "updater",
        foreignKey: "updated_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      JournalEntry.belongsTo(models.UserProfiles, {
        as: "deleter",
        foreignKey: "deleted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });

      JournalEntry.belongsTo(models.UserProfiles, {
        as: "poster",
        foreignKey: "posted_by",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  JournalEntry.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      entry_date: {
        type: DataTypes.DATE,
      },
      entry_number: {
        type: DataTypes.STRING,
      },
      reference_type: {
        type: DataTypes.ENUM(
          "PROCUREMENT",
          "PRODUCTION",
          "QA",
          "PACKING",
          "DISPATCH",
          "SALES",
          "PAYMENT",
          "MANUAL",
        ),
      },
      reference_id: {
        type: DataTypes.UUID,
      },
      description: {
        type: DataTypes.TEXT,
      },
      total_debit: {
        type: DataTypes.DECIMAL(18, 2),
      },
      total_credit: {
        type: DataTypes.DECIMAL(18, 2),
      },
      currency: {
        type: DataTypes.STRING,
      },
      is_posted: {
        type: DataTypes.BOOLEAN,
      },
      posted_at: {
        type: DataTypes.DATE,
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
      modelName: "JournalEntry",
      tableName: "journal_entry",
      underscored: true,
      createdAt: false,
      updatedAt: false,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  // Hooks
  JournalEntry.beforeCreate(async (data, options) => {
    try {
      data.created_by = options.profile_id;
      data.entry_date = new Date();
      // Generate unique entry number: JE-YYYYMMDD-UUID
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      data.entry_number = `JE-${dateStr}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    } catch (err) {
      throw err;
    }
  });

  JournalEntry.beforeUpdate(async (data, options) => {
    try {
      data.updated_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  JournalEntry.beforeDestroy(async (data, options) => {
    try {
      data.deleted_by = options.profile_id;
    } catch (err) {
      throw err;
    }
  });

  return JournalEntry;
};
