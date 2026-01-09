"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChartOfAccounts extends Model {
    static associate(models) {
      this.hasMany(models.GLPosting, {
        foreignKey: "account_code",
        sourceKey: "account_code",
        as: "glPostings",
      });
    }
  }

  ChartOfAccounts.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      account_code: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
        comment: "Unique account code (e.g., 1000, 1100, 4000)",
      },
      account_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Account name (e.g., Cash, Sales Revenue)",
      },
      account_type: {
        type: DataTypes.ENUM(
          "ASSET",
          "LIABILITY",
          "EQUITY",
          "REVENUE",
          "EXPENSE",
          "OTHER"
        ),
        allowNull: false,
        comment: "Type of account for GL classification",
      },
      description: {
        type: DataTypes.TEXT,
        comment: "Detailed description of the account",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Whether this account is currently active",
      },
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "ChartOfAccounts",
      tableName: "chart_of_accounts",
      timestamps: true,
    }
  );

  return ChartOfAccounts;
};
