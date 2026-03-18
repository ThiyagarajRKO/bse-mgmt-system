'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if column already exists
      const tableDescription = await queryInterface.describeTable('packing');
      
      if (!tableDescription.lot_no) {
        await queryInterface.addColumn('packing', 'lot_no', {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Lot number from procurement'
        });

        // Create index on lot_no for faster queries
        await queryInterface.addIndex('packing', ['lot_no'], {
          name: 'idx_packing_lot_no',
          unique: false
        });

        console.log('✅ Successfully added lot_no column to packing table');
      }
    } catch (error) {
      console.error('Error adding lot_no to packing:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableDescription = await queryInterface.describeTable('packing');
      
      if (tableDescription.lot_no) {
        await queryInterface.removeColumn('packing', 'lot_no');
        console.log('✅ Successfully removed lot_no column from packing table');
      }
    } catch (error) {
      console.error('Error removing lot_no from packing:', error.message);
      throw error;
    }
  }
};
