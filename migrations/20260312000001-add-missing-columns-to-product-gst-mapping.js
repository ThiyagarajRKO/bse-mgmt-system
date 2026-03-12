'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add missing columns to product_gst_mapping if they don't exist
      const tableDescription = await queryInterface.describeTable('product_gst_mapping');
      
      const columnsToAdd = [];

      if (!tableDescription.supply_type) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'supply_type', 
            { type: Sequelize.STRING(50), allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.cgst_rate) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'cgst_rate',
            { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.sgst_rate) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'sgst_rate',
            { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.igst_rate) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'igst_rate',
            { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.effective_from) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'effective_from',
            { type: Sequelize.DATE, allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.effective_to) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'effective_to',
            { type: Sequelize.DATE, allowNull: true },
            { transaction })
        );
      }

      if (!tableDescription.note) {
        columnsToAdd.push(
          queryInterface.addColumn('product_gst_mapping', 'note',
            { type: Sequelize.TEXT, allowNull: true },
            { transaction })
        );
      }

      if (columnsToAdd.length > 0) {
        console.log(`Adding ${columnsToAdd.length} missing columns to product_gst_mapping...`);
        await Promise.all(columnsToAdd);
        console.log('✓ All missing columns added successfully');
      } else {
        console.log('✓ All required columns already exist in product_gst_mapping');
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Error in migration:', err);
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDescription = await queryInterface.describeTable('product_gst_mapping');

      const columnsToRemove = ['supply_type', 'cgst_rate', 'sgst_rate', 'igst_rate', 'effective_from', 'effective_to', 'note'];
      const removals = [];

      for (const column of columnsToRemove) {
        if (tableDescription[column]) {
          removals.push(
            queryInterface.removeColumn('product_gst_mapping', column, { transaction })
          );
        }
      }

      if (removals.length > 0) {
        console.log(`Removing ${removals.length} columns from product_gst_mapping...`);
        await Promise.all(removals);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
