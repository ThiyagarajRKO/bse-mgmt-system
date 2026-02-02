"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use raw SQL to create the enum type and add the column
    await queryInterface.sequelize.query(`
      -- Create the enum type with all required subcategory values
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

      -- Add the subcategory column to species_master table
      ALTER TABLE species_master ADD COLUMN subcategory enum_species_master_subcategory;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the column and drop the enum type
    await queryInterface.sequelize.query(`
      -- Drop the column
      ALTER TABLE species_master DROP COLUMN IF EXISTS subcategory;

      -- Drop the enum type
      DROP TYPE IF EXISTS enum_species_master_subcategory;
    `);
  },
};
