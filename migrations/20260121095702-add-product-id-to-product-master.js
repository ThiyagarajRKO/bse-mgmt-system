"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First add the column as nullable
    await queryInterface.addColumn("product_master", "product_id", {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "System-generated SKU (e.g., SNP-WHL-RAW-1_2KG)",
    });

    // Generate product_id values for existing records
    // Use a combination of product info to create unique SKUs
    await queryInterface.sequelize.query(`
      UPDATE product_master
      SET product_id = CONCAT(
        'PRD-',
        UPPER(REPLACE(COALESCE(product_name, 'UNKNOWN'), ' ', '-')),
        '-',
        SUBSTRING(MD5(RANDOM()::text), 1, 8)
      )
      WHERE product_id IS NULL
    `);

    // Add unique constraint
    await queryInterface.addIndex("product_master", ["product_id"], {
      unique: true,
    });

    // Now make the column NOT NULL
    await queryInterface.changeColumn("product_master", "product_id", {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: "System-generated SKU (e.g., SNP-WHL-RAW-1_2KG)",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("product_master", ["product_id"]);
    await queryInterface.removeColumn("product_master", "product_id");
  },
};
