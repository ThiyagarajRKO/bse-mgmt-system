"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add HSN code column to product_master table
    await queryInterface.addColumn("product_master", "hsn_code", {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment:
        "HSN (Harmonized System of Nomenclature) code for GST classification",
      after: "product_name", // Position after product_name column
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove HSN code column from product_master table
    await queryInterface.removeColumn("product_master", "hsn_code");
  },
};
