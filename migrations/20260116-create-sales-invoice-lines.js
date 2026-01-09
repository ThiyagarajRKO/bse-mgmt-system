"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sales_invoice_lines", {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "sales_invoices" },
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      production_output_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment:
          "Links to finished goods from production (FK to be added when production_outputs table is created)",
      },
      product_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: "product_master" },
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      sku_code: {
        type: Sequelize.STRING(100),
        comment: "SKU code from product (denormalized for invoice)",
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "From production_outputs.cost_allocated / quantity",
      },
      line_total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: "quantity × cost_per_unit (before tax)",
      },
      hsn_code: {
        type: Sequelize.STRING(20),
        comment: "HSN code from product master for GST calculation",
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        comment: "GST rate (5%, 12%, 18%, etc)",
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      line_net_total: {
        type: Sequelize.DECIMAL(12, 2),
        comment: "line_total + tax_amount",
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });

    // Indexes
    await queryInterface.addIndex("sales_invoice_lines", ["invoice_id"]);
    await queryInterface.addIndex("sales_invoice_lines", [
      "production_output_id",
    ]);
    await queryInterface.addIndex("sales_invoice_lines", ["product_master_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("sales_invoice_lines");
  },
};
