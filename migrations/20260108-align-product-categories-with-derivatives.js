"use strict";

/**
 * Product Categories Aligned with Derivative Master
 *
 * This migration restructures product categories to align with the derivative_master table
 * which defines processing levels:
 * - Raw (whole, fillet, tail, tube)
 * - Semi-Processed (peeled & deveined, minced)
 * - Cooked (boiled, smoked)
 * - RTC (Ready to Cook - breaded, battered)
 * - RTE (Ready to Eat - canned, retort)
 * - Processed (stock, broth, concentrate)
 * - Byproduct (shell, waste)
 *
 * Storage States:
 * - Fresh (0°C to 4°C)
 * - Frozen (-18°C)
 * - Live (ambient with aeration)
 * - Cooked (various states)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Drop the existing enum
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category 
       RENAME TO enum_product_packaging_rules_product_category_old;`
    );

    // Step 2: Create new enum with organized product categories aligned to derivatives
    await queryInterface.sequelize.query(
      `CREATE TYPE enum_product_packaging_rules_product_category AS ENUM (
        -- RAW PROCESSING LEVEL
        'Whole', 'Whole Round', 'Whole Cleaned', 'Whole Shell', 'Whole Crab', 'Whole Fish',
        'Headless', 'HOSO', 'HLSO', 'HL', 'EZ Peel', 'Live Shell',
        'Fillet', 'Fillets', 'Boneless Fillet', 'Skinless Fillet', 
        'Tail', 'Lobster Tails', 'Tentacle', 'Tentacles',
        'Tube', 'Tubes (T1/T2/T3/T4)', 'Rings',
        'Semi Cleaned', 'Live', 'Raw Meat (Peeled)',
        
        -- SEMI-PROCESSED LEVEL
        'Peeled', 'Peeled & Deveined', 'PD', 'PDTO', 'PUD', 'PUDTO',
        'Minced Meat', 'Flake', 'Flake Cut', 'Sliced Meat', 'Slices',
        'Body Meat', 'Claw Meat', 'Knuckle Meat', 'Leg Meat', 
        'Crab Meat', 'Meat Only', 'Claw & Leg Combo',
        'Scallop Meat', 'Scallop Roe Only', 'IQF Meat', 'Lump', 'Jumbo Lump',
        'Nobashi', 'Roe On', 'Roe Off',
        
        -- COOKED LEVEL
        'Cooked', 'Cooked Meat', 'Boiled', 'Steamed', 'Grilled', 'Smoked',
        'Pre-cooked IQF', 'Marinated',
        
        -- CUT/SPECIALIZED FORMS
        'Butterfly Cut', 'Steaks', 'Cut Piece', 'Hammerhead Shark Cut Piece', 
        'Milk Shark Cut Piece', 'Spiny Dogfish Cut Piece', 'Half Shell', 
        'Half Cut Crab', 'Soft Shell Cut', 'Soft Shell Whole', 'Crab Clusters', 
        'Snow Crab Sections', 'King Crab Cuts',
        
        -- RTC (READY TO COOK)
        'Breaded', 'Breaded / Battered',
        
        -- RTE (READY TO EAT)
        'Canned', 'Canned / Retort', 'Blanched',
        
        -- PROCESSED/VALUE-ADDED
        'Stock / Broth / Concentrate', 'Special', 'Block Frozen',
        
        -- BYPRODUCT/WASTE
        'Shell', 'Shell / Waste', 'Strips',
        
        -- SPECIALTY CUTS
        'Wing Cut', 'Wing Fillet', 'Cluster',
        
        -- CATCH FORMS
        'Hammerhead Shark Whole', 'Milk Shark Whole', 'Milk Shark Boneless Fillet',
        'Spiny Dogfish Whole', 'Spiny Dogfish Skinless Fillet',
        
        -- STORAGE STATES
        'Fresh', 'Frozen', 'IQF',
        
        -- CATCH-ALL
        'ALL'
      );`
    );

    // Step 3: Migrate existing data
    await queryInterface.sequelize.query(
      `ALTER TABLE product_packaging_rules 
       ALTER COLUMN product_category TYPE enum_product_packaging_rules_product_category 
       USING product_category::text::enum_product_packaging_rules_product_category;`
    );

    // Step 4: Drop old enum
    await queryInterface.sequelize.query(
      `DROP TYPE enum_product_packaging_rules_product_category_old;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert to previous enum version
    await queryInterface.sequelize.query(
      `ALTER TYPE enum_product_packaging_rules_product_category 
       RENAME TO enum_product_packaging_rules_product_category_aligned;`
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
      `DROP TYPE enum_product_packaging_rules_product_category_aligned;`
    );
  },
};
