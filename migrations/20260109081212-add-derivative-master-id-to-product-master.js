'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Checking if derivative_master_id column exists in product_master table...");
      const table = await queryInterface.describeTable('product_master');
      
      if (!table.derivative_master_id) {
        console.log("Adding derivative_master_id column to product_master table...");
        await queryInterface.addColumn('product_master', 'derivative_master_id', {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "Reference to derivative_master",
          references: {
            model: 'derivative_master',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        
        // Create index for performance
        await queryInterface.addIndex('product_master', ['derivative_master_id'], {
          name: 'idx_product_derivative_master_id'
        });
        
        console.log("✅ derivative_master_id column added successfully");
      } else {
        console.log("✅ derivative_master_id column already exists");
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('product_master');
      if (table.derivative_master_id) {
        await queryInterface.removeColumn('product_master', 'derivative_master_id');
      }
    } catch (error) {
      console.error("❌ Error in rollback:", error.message);
    }
  }
};
