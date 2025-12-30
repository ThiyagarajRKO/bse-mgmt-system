"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing enum constraint and recreate it with correct values
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_parent_category_type RENAME TO enum_product_packaging_rules_parent_category_type_old;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_parent_category_type AS ENUM ('Fish', 'Crustacean', 'Bivalve', 'Cephalopod', 'Gastropod', 'ALL');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules ALTER COLUMN parent_category_type TYPE enum_product_packaging_rules_parent_category_type USING parent_category_type::text::enum_product_packaging_rules_parent_category_type;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_parent_category_type_old;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert to old enum
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_parent_category_type RENAME TO enum_product_packaging_rules_parent_category_type_new;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_parent_category_type AS ENUM ('Fish', 'Crustacean', 'Cephalopod', 'Mollusk', 'ALL');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules ALTER COLUMN parent_category_type TYPE enum_product_packaging_rules_parent_category_type USING parent_category_type::text::enum_product_packaging_rules_parent_category_type;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_parent_category_type_new;`
    );
  },
};
