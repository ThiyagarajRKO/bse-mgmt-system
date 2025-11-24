'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if column exists and modify it to allow null
    const tableDescription = await queryInterface.describeTable('supplier_master');
    
    if (tableDescription.company_id) {
      // Column exists, modify it to allow null
      await queryInterface.changeColumn('supplier_master', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'company_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    } else {
      // Column doesn't exist, add it
      await queryInterface.addColumn('supplier_master', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'company_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Don't remove the column in down migration since it might be needed
    // Just change it back to not null if it exists
    const tableDescription = await queryInterface.describeTable('supplier_master');
    
    if (tableDescription.company_id) {
      await queryInterface.changeColumn('supplier_master', 'company_id', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'company_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      });
    }
  }
};
