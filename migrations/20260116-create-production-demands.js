'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('production_demands', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      demand_number: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: 'Format: DEM-YYYYMMDD-HHMMSS-XXXX',
      },
      sales_allocation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'sales_allocations' },
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      production_order_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Linked production order once created (FK to be added when production_orders table is created)',
      },
      product_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'product_master' },
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      demanded_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Quantity required for this sales order line',
      },
      fulfilled_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Quantity fulfilled by production',
      },
      demand_status: {
        type: Sequelize.ENUM(
          'CREATED',
          'WAITING_FOR_PRODUCTION',
          'IN_PRODUCTION',
          'PRODUCTION_COMPLETE',
          'DISPATCHED',
          'FULFILLED',
          'CANCELLED'
        ),
        defaultValue: 'CREATED',
        comment: 'Demand fulfillment lifecycle',
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        defaultValue: 'MEDIUM',
      },
      required_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Date by which production is needed',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
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
      updated_at: {
        type: Sequelize.DATE,
      },
      remarks: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    });

    // Indexes
    await queryInterface.addIndex('production_demands', ['demand_number'], {
      unique: true,
    });
    await queryInterface.addIndex('production_demands', ['sales_allocation_id']);
    await queryInterface.addIndex('production_demands', ['production_order_id']);
    await queryInterface.addIndex('production_demands', ['product_master_id']);
    await queryInterface.addIndex('production_demands', ['demand_status']);
    await queryInterface.addIndex('production_demands', ['required_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('production_demands');
  },
};
