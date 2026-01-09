"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SalesInvoice extends Model {
    static associate(models) {
      // Belongs to Order and CustomerMaster
      if (models.Order) {
        this.belongsTo(models.Order, {
          foreignKey: "order_id",
          as: "order",
        });
      }

      if (models.CustomerMaster) {
        this.belongsTo(models.CustomerMaster, {
          foreignKey: "customer_master_id",
          as: "customer",
        });
      }

      // Has many InvoiceLines
      if (models.SalesInvoiceLine) {
        this.hasMany(models.SalesInvoiceLine, {
          foreignKey: "invoice_id",
          as: "invoiceLines",
        });
      }
    }
  }

  SalesInvoice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoice_number: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: "Unique invoice identifier (INV-YYYYMMDD-HHMMSS-XXXX)",
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customer_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      invoice_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      invoice_status: {
        type: DataTypes.ENUM("DRAFT", "POSTED", "PAID", "CANCELLED"),
        defaultValue: "DRAFT",
        allowNull: false,
      },
      subtotal_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: "Sum of all line items (before tax & shipping)",
      },
      tax_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: "Total GST/HSN-based tax",
      },
      shipping_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      net_total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
        comment: "subtotal + tax + shipping - discount",
      },
      posted_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When invoice was posted to GL",
      },
      posted_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "User who posted to GL",
      },
      remarks: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "SalesInvoice",
      tableName: "sales_invoices",
      timestamps: true,
      underscored: true,
    }
  );

  return SalesInvoice;
};
