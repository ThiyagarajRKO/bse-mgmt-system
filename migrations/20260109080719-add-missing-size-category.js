'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("Checking if size_category column exists in size_master table...");
      const table = await queryInterface.describeTable('size_master');
      
      if (!table.size_category) {
        console.log("Adding size_category column to size_master table...");
        await queryInterface.addColumn('size_master', 'size_category', {
          type: Sequelize.STRING,
          comment: "Category: FISH, SHRIMP, CEPHALOPOD, CRUSTACEAN, BIVALVE",
          allowNull: true,
        });
        console.log("✅ size_category column added successfully");
      } else {
        console.log("✅ size_category column already exists");
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('size_master');
      if (table.size_category) {
        await queryInterface.removeColumn('size_master', 'size_category');
      }
    } catch (error) {
      console.error("❌ Error in rollback:", error.message);
    }
  }
};
