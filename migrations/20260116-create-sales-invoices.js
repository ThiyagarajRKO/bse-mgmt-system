'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sales_invoices', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Format: INV-YYYYMMDD-HHMMSS-XXXX',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'orders' },
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      customer_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'customer_master' },
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      invoice_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      invoice_status: {
        type: Sequelize.ENUM('DRAFT', 'POSTED', 'PAID', 'CANCELLED'),
        defaultValue: 'DRAFT',
        comment: 'Invoice lifecycle: DRAFT → POSTED → PAID',
      },
      subtotal_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Sum of (cost_per_unit × quantity) for all lines',
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'Total GST/tax calculated at invoice level',
      },
      shipping_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      net_total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
        comment: 'subtotal + tax + shipping - discount',
      },
      payment_due_date: {
        type: Sequelize.DATE,
      },
      posted_date: {
        type: Sequelize.DATE,
        comment: 'Date when invoice was posted to GL',
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      created_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: 'user_profiles' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      posted_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: 'user_profiles' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'User who posted the invoice to GL',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    // Indexes
    await queryInterface.addIndex('sales_invoices', ['invoice_number'], {
      unique: true,
    });
    await queryInterface.addIndex('sales_invoices', ['order_id']);
    await queryInterface.addIndex('sales_invoices', ['customer_master_id']);
    await queryInterface.addIndex('sales_invoices', ['invoice_status']);
    await queryInterface.addIndex('sales_invoices', ['invoice_date']);
    await queryInterface.addIndex('sales_invoices', ['posted_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sales_invoices');
  },
};
