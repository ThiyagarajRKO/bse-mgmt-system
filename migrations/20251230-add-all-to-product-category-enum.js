"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update the product_category enum to include 'ALL' for generic rules
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category RENAME TO enum_product_packaging_rules_product_category_old;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_product_category AS ENUM ('Fresh', 'Frozen', 'Cooked', 'Live', 'ALL');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules ALTER COLUMN product_category TYPE enum_product_packaging_rules_product_category USING product_category::text::enum_product_packaging_rules_product_category;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_product_category_old;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert to old enum
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category RENAME TO enum_product_packaging_rules_product_category_new;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_product_category AS ENUM ('Fresh', 'Frozen', 'Cooked', 'Live');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules ALTER COLUMN product_category TYPE enum_product_packaging_rules_product_category USING product_category::text::enum_product_packaging_rules_product_category;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_product_category_new;`
    );
  },
};
