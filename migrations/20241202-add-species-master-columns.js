"use strict";

/**
 * Consolidated Migration: Add new columns to species_master table
 *
 * This migration consolidates the following column additions:
 * 1. hsn_code (STRING) - GST/HSN tax classification code
 * 2. parent_category_type (ENUM) - Species taxonomic classification
 *
 * These columns enhance the species data model with tax compliance
 * and hierarchical categorization capabilities.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add HSN Code column for GST tax compliance
    await queryInterface.addColumn("species_master", "hsn_code", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "scientific_name",
    });

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
      after: "hsn_code",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove parent_category_type column
    await queryInterface.removeColumn("species_master", "parent_category_type");

    // Remove HSN Code column
    await queryInterface.removeColumn("species_master", "hsn_code");
  },
};
