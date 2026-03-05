"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log(
      "\n🔧 Migrating: Making procurement_product_id nullable in bill_of_materials...\n",
    );

    try {
      await queryInterface.changeColumn(
        "bill_of_materials",
        "procurement_product_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          comment:
            "Optional reference to procurement product. BOMs can exist without procurement products for mapping purposes.",
        },
      );

      console.log("✅ Successfully made procurement_product_id nullable\n");
    } catch (error) {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log(
      "\n🔄 Rolling back: Making procurement_product_id NOT NULL...\n",
    );

    try {
      await queryInterface.changeColumn(
        "bill_of_materials",
        "procurement_product_id",
        {
          type: Sequelize.UUID,
          allowNull: false,
        },
      );

      console.log("✅ Successfully rolled back\n");
    } catch (error) {
      console.error("❌ Rollback failed:", error.message);
      throw error;
    }
  },
};
