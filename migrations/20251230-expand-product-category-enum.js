"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing enum and recreate with all product categories
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category RENAME TO enum_product_packaging_rules_product_category_old;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_product_category AS ENUM (
        'Blanched', 'Block Frozen', 'Body Meat', 'Boneless Fillet', 'Breaded', 
        'Butterfly Cut', 'Claw & Leg Combo', 'Claw Meat', 'Cluster', 'Cooked', 
        'Cooked Meat', 'Crab Clusters', 'Crab Meat', 'Cut Piece', 'EZ Peel', 
        'Fillet', 'Fillets', 'Flake', 'Flake Cut', 'Grilled', 'Half Cut Crab', 
        'Half Shell', 'Hammerhead Shark Cut Piece', 'Hammerhead Shark Whole', 
        'Headless', 'HL', 'HLSO', 'HOSO', 'IQF', 'IQF Meat', 'Jumbo Lump', 
        'King Crab Cuts', 'Knuckle Meat', 'Leg Meat', 'Live', 'Live Shell', 
        'Lobster Tails', 'Lump', 'Marinated', 'Meat Only', 'Milk Shark Boneless Fillet', 
        'Milk Shark Cut Piece', 'Milk Shark Whole', 'Nobashi', 'PD', 'PDTO', 
        'Peeled', 'Pre-cooked IQF', 'PUD', 'PUDTO', 'Raw Meat (Peeled)', 'Rings', 
        'Roe Off', 'Roe On', 'Scallop Half Shell', 'Scallop Meat', 'Scallop Roe Only', 
        'Semi Cleaned', 'Skinless Fillet', 'Sliced Meat', 'Slices', 'Smoked', 
        'Snow Crab Sections', 'Soft Shell Cut', 'Soft Shell Whole', 'Special', 
        'Spiny Dogfish Cut Piece', 'Spiny Dogfish Skinless Fillet', 'Spiny Dogfish Whole', 
        'Steaks', 'Steamed', 'Strips', 'Tentacle', 'Tentacles', 'Tubes (T1/T2/T3/T4)', 
        'Whole', 'Whole Cleaned', 'Whole Crab', 'Whole Fish', 'Whole Round', 'Whole Shell', 
        'Wing Cut', 'Wing Fillet', 'Fresh', 'Frozen', 'Live', 'ALL'
      );`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules 
       ALTER COLUMN product_category TYPE enum_product_packaging_rules_product_category 
       USING product_category::text::enum_product_packaging_rules_product_category;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_product_category_old;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert to limited enum
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category RENAME TO enum_product_packaging_rules_product_category_new;`
    );

    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_product_category AS ENUM ('Fresh', 'Frozen', 'Cooked', 'Live');`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules 
       ALTER COLUMN product_category TYPE enum_product_packaging_rules_product_category 
       USING product_category::text::enum_product_packaging_rules_product_category;`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_product_category_new;`
    );
  },
};
