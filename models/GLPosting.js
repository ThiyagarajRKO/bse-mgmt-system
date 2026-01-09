"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class GLPosting extends Model {
    static associate(models) {
      // Belongs to ChartOfAccounts, ProductionOutput, SalesInvoice, SalesPayment
      if (models.ChartOfAccounts) {
        this.belongsTo(models.ChartOfAccounts, {
          foreignKey: "account_code",
          targetKey: "account_code",
          as: "account",
        });
      }

      if (models.ProductionOutput) {
        this.belongsTo(models.ProductionOutput, {
          foreignKey: "production_output_id",
          as: "productionOutput",
        });
      }

      if (models.SalesInvoice) {
        this.belongsTo(models.SalesInvoice, {
          foreignKey: "invoice_id",
          as: "invoice",
        });
      }

      if (models.SalesPayment) {
        this.belongsTo(models.SalesPayment, {
          foreignKey: "payment_id",
          as: "payment",
        });
      }

      // Self-referential association for reversals
      this.belongsTo(models.GLPosting, {
        foreignKey: "reversal_entry_id",
        as: "reversalEntry",
      });

      this.hasMany(models.GLPosting, {
        foreignKey: "reversal_entry_id",
        as: "reversedBy",
      });
    }
  }

  GLPosting.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      entry_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: "Unique GL entry identifier (GL-YYYYMMDD-HHMMSS-XXXX)",
      },
      posting_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      account_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      debit: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      credit: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0,
      },
      production_output_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Link to finished goods posting",
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Link to sales invoice",
      },
      payment_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Link to payment",
      },
      description: {
        type: DataTypes.TEXT,
      },
      posting_status: {
        type: DataTypes.ENUM("DRAFT", "POSTED", "REVERSED"),
        defaultValue: "DRAFT",
        allowNull: false,
      },
      reversal_entry_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      posted_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      posted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "GLPosting",
      tableName: "gl_postings",
      timestamps: true,
      underscored: true,
    }
  );

  return GLPosting;
};
