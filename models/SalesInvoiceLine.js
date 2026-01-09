'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SalesInvoiceLine extends Model {
    static associate(models) {
      // Belongs to Invoice, ProductionOutput, ProductMaster
      if (models.SalesInvoice) {
        this.belongsTo(models.SalesInvoice, {
          foreignKey: 'invoice_id',
          as: 'invoice',
        });
      }

      if (models.ProductionOutput) {
        this.belongsTo(models.ProductionOutput, {
          foreignKey: 'production_output_id',
          as: 'productionOutput',
        });
      }

      if (models.ProductMaster) {
        this.belongsTo(models.ProductMaster, {
          foreignKey: 'product_master_id',
          as: 'productMaster',
        });
      }
    }
  }

  SalesInvoiceLine.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      production_output_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Links to finished goods from production',
      },
      product_master_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sku_code: {
        type: DataTypes.STRING(100),
        comment: 'SKU code from product (denormalized for invoice)',
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_per_unit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'From production_outputs.cost_allocated / quantity',
      },
      line_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'quantity × cost_per_unit (before tax)',
      },
      hsn_code: {
        type: DataTypes.STRING(20),
        comment: 'HSN code from product master for GST calculation',
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
        comment: 'GST rate (5%, 12%, 18%, etc)',
      },
      tax_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      line_net_total: {
        type: DataTypes.DECIMAL(12, 2),
        comment: 'line_total + tax_amount',
      },
      remarks: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'SalesInvoiceLine',
      tableName: 'sales_invoice_lines',
      timestamps: true,
      underscored: true,
    }
  );

  return SalesInvoiceLine;
};
