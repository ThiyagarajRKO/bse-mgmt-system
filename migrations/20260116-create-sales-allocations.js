'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('sales_allocations', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
      order_product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'order_products' },
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      allocation_status: {
        type: Sequelize.ENUM(
          'PENDING',
          'PARTIAL',
          'ALLOCATED',
          'PRODUCTION_IN_PROGRESS',
          'COMPLETED',
          'CANCELLED'
        ),
        defaultValue: 'PENDING',
        comment: 'Allocation lifecycle: PENDING → ALLOCATED → PRODUCTION → COMPLETED',
      },
      allocated_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Quantity allocated to production',
      },
      fulfilled_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Quantity fulfilled by production',
      },
      ordered_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Original order quantity (from order_products)',
      },
      allocation_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      allocated_by: {
        type: Sequelize.UUID,
        references: {
          model: { tableName: 'user_profiles' },
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex('sales_allocations', ['order_id']);
    await queryInterface.addIndex('sales_allocations', ['order_product_id']);
    await queryInterface.addIndex('sales_allocations', ['allocation_status']);
    await queryInterface.addIndex('sales_allocations', ['allocation_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sales_allocations');
  },
};
