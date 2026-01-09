'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Checking if size range columns exist in size_master table...");
      const table = await queryInterface.describeTable('size_master');
      
      if (!table.min_value) {
        console.log("Adding min_value column to size_master table...");
        await queryInterface.addColumn('size_master', 'min_value', {
          type: Sequelize.FLOAT,
          comment: "Minimum value for size",
          allowNull: true,
        });
      }
      
      if (!table.max_value) {
        console.log("Adding max_value column to size_master table...");
        await queryInterface.addColumn('size_master', 'max_value', {
          type: Sequelize.FLOAT,
          comment: "Maximum value for size",
          allowNull: true,
        });
      }
      
      console.log("✅ Size range columns added successfully");
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('size_master');
      if (table.min_value) {
        await queryInterface.removeColumn('size_master', 'min_value');
      }
      if (table.max_value) {
        await queryInterface.removeColumn('size_master', 'max_value');
      }
    } catch (error) {
      console.error("❌ Error in rollback:", error.message);
    }
  }
};
