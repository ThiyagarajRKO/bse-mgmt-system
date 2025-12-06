"use strict";

/**
 * Consolidated Migration: Add new columns to species_master table
 *
 * This migration consolidates the following column additions:
 * 1. parent_category_type (ENUM) - Species taxonomic classification
 * 2. hsn_code (STRING) - GST/HSN tax classification code
 *
 * These columns enhance the species data model with hierarchical categorization
 * and tax compliance capabilities.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add Parent Category Type column for species taxonomic classification
    await queryInterface.addColumn("species_master", "parent_category_type", {
      type: Sequelize.ENUM(
        "Bivalve",
        "Cephalopod",
        "Fish",
        "Crustacean",
        "Gastropod",
        "Other"
      ),
      allowNull: true,
      defaultValue: "Other",
      after: "division_master_id",
    });

    // Add HSN Code column for GST tax compliance
    await queryInterface.addColumn("species_master", "hsn_code", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "scientific_name",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove HSN Code column
    await queryInterface.removeColumn("species_master", "hsn_code");

    // Remove parent_category_type column
    await queryInterface.removeColumn("species_master", "parent_category_type");
  },
};
