"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use raw SQL to properly update the enum
    await queryInterface.sequelize.query(`
      -- First, drop the column that depends on the enum
      ALTER TABLE species_master DROP COLUMN IF EXISTS subcategory;

      -- Drop and recreate the enum type with all required values
      DROP TYPE IF EXISTS enum_species_master_subcategory;
      CREATE TYPE enum_species_master_subcategory AS ENUM (
        'Oyster',
        'Mussel',
        'Clam-Scallop',
        'Squid',
        'Cuttlefish',
        'Octopus',
        'Pelagic-Large',
        'Pelagic-Medium',
        'Round-Fish',
        'Flat-Fish',
        'Shark',
        'Ray',
        'Shrimp-Prawn',
        'Crab',
        'Lobster',
        'Abalone',
        'Top-Shell-Turban',
        'Babylon-Snail'
      );

      -- Recreate the column with the new enum
      ALTER TABLE species_master ADD COLUMN subcategory enum_species_master_subcategory;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert to original enum
    await queryInterface.sequelize.query(`
      UPDATE species_master SET subcategory = NULL WHERE subcategory IS NOT NULL;
      DROP TYPE IF EXISTS enum_species_master_subcategory;
      CREATE TYPE enum_species_master_subcategory AS ENUM (
        'Round fish',
        'Flat fish',
        'Large pelagic (tuna)',
        'Sharks & rays (cartilage)',
        'Shrimp/prawn',
        'Crab',
        'Lobster',
        'Squid',
        'Cuttlefish',
        'Octopus'
      );
    `);
  },
};
