"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Change product_category from ENUM to VARCHAR to support dynamic categories
    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules ALTER COLUMN product_category TYPE VARCHAR(100);`
    );

    // Drop the enum type if it exists
    try {
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS enum_product_packaging_rules_product_category;`
      );
    } catch (e) {
      console.log("Could not drop enum type");
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert to enum if needed (would require creating the enum first)
    // This is a one-way migration as we're moving to more flexible VARCHAR
  },
};
