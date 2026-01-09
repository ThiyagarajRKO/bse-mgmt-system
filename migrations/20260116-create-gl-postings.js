'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('gl_postings', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      entry_number: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Unique GL entry identifier (GL-YYYYMMDD-HHMMSS-XXXX)',
      },
      posting_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        index: true,
      },
      account_code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        index: true,
        comment: 'GL Account Code (e.g., 1000-Assets, 4000-Sales Revenue). FK constraint to be added when chart_of_accounts has unique constraint',
      },
      debit: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      credit: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      production_output_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Link to finished goods posting (FK to be added when production_outputs table is created)',
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'sales_invoices' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Link to sales invoice (Dr AR, Cr Sales Revenue)',
      },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'sales_payments' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Link to payment (Dr Cash, Cr AR)',
      },
      description: {
        type: Sequelize.TEXT,
        comment: 'GL entry description (e.g., "Finished goods receipt from PO-20260116-00001")',
      },
      posting_status: {
        type: Sequelize.ENUM('DRAFT', 'POSTED', 'REVERSED'),
        defaultValue: 'DRAFT',
        allowNull: false,
        comment: 'DRAFT (editable), POSTED (immutable), REVERSED (reversal entry)',
      },
      reversal_entry_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'gl_postings' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
        comment: 'Reference to reversal entry if this entry was reversed',
      },
      posted_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'User who posted the entry',
      },
      posted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the entry was actually posted',
      },
      remarks: {
        type: Sequelize.TEXT,
        comment: 'Additional remarks or notes',
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
    });

    // Indexes for common queries
    await queryInterface.addIndex('gl_postings', ['entry_number']);
    await queryInterface.addIndex('gl_postings', ['posting_date']);
    await queryInterface.addIndex('gl_postings', ['account_code']);
    await queryInterface.addIndex('gl_postings', ['posting_status']);
    await queryInterface.addIndex('gl_postings', ['production_output_id']);
    await queryInterface.addIndex('gl_postings', ['invoice_id']);
    await queryInterface.addIndex('gl_postings', ['payment_id']);
    await queryInterface.addIndex('gl_postings', [
      'posting_date',
      'posting_status',
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('gl_postings');
  },
};
