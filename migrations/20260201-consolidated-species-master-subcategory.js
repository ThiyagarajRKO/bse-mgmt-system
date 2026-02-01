"use strict";

/**
 * CONSOLIDATED SPECIES MASTER SUBCATEGORY MIGRATION
 *
 * This migration consolidates the following individual migrations:
 * - 20260129145444-add-subcategory-to-species-master.js
 * - 20260130083240-add-subcategory-to-species-master.js (duplicate)
 * - 20260130084449-update-subcategory-enum-with-all-values.js
 * - 20260130084648-fix-subcategory-enum.js
 * - 20260131000000-consolidate-species-master-subcategory.js
 *
 * Creates the subcategory column on species_master table with the complete enum
 * in a single migration to avoid conflicts and ensure proper ordering.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "Creating consolidated species master subcategory migration...",
    );

    // Use raw SQL to create the enum type and add the column properly
    await queryInterface.sequelize.query(`
      -- Create the enum type with all required subcategory values
      DO $$ BEGIN
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
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Add the subcategory column to species_master table if it doesn't exist
      ALTER TABLE species_master
      ADD COLUMN IF NOT EXISTS subcategory enum_species_master_subcategory;
    `);

    console.log("Species master subcategory column created successfully");
  },

  async down(queryInterface, Sequelize) {
    console.log(
      "Reverting consolidated species master subcategory migration...",
    );

    // Remove the column and drop the enum type
    await queryInterface.sequelize.query(`
      -- Drop the column if it exists
      ALTER TABLE species_master DROP COLUMN IF EXISTS subcategory;

      -- Drop the enum type if it exists
      DROP TYPE IF EXISTS enum_species_master_subcategory;
    `);

    console.log("Species master subcategory column removed successfully");
  },
};
