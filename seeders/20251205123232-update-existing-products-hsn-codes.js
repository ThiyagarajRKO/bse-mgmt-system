"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔄 Updating existing products with HSN codes from species...");

    // Update products with HSN codes from their species
    const updateQuery = `
      UPDATE product_master
      SET hsn_code = species_master.hsn_code
      FROM product_category_master
      INNER JOIN species_master ON product_category_master.species_master_id = species_master.id
      WHERE product_master.product_category_master_id = product_category_master.id
      AND product_master.hsn_code IS NULL
      AND species_master.hsn_code IS NOT NULL
      AND product_master.is_active = true
      AND product_category_master.is_active = true
      AND species_master.is_active = true;
    `;

    const result = await queryInterface.sequelize.query(updateQuery);
    console.log(
      `✅ Updated ${result[1].rowCount} products with HSN codes from species`
    );
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Reverting HSN code updates...");

    // Clear HSN codes that were auto-populated (optional - you might want to keep them)
    // This down migration is optional since HSN codes are beneficial to keep
    console.log("ℹ️  Keeping HSN codes in products (not reverting)");
  },
};
