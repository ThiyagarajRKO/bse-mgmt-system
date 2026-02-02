"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing column and recreate with new enum
    await queryInterface.removeColumn("species_master", "subcategory");

    await queryInterface.addColumn("species_master", "subcategory", {
      type: Sequelize.ENUM(
        // Bivalve subcategories
        "Oyster",
        "Mussel",
        "Clam-Scallop",
        // Cephalopod subcategories
        "Squid",
        "Cuttlefish",
        "Octopus",
        // Fish subcategories
        "Pelagic-Large",
        "Pelagic-Medium",
        "Round-Fish",
        "Flat-Fish",
        "Shark",
        "Ray",
        // Crustacean subcategories
        "Shrimp-Prawn",
        "Crab",
        "Lobster",
        // Gastropod subcategories
        "Abalone",
        "Top-Shell-Turban",
        "Babylon-Snail",
      ),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the column and recreate with original enum
    await queryInterface.removeColumn("species_master", "subcategory");

    await queryInterface.addColumn("species_master", "subcategory", {
      type: Sequelize.ENUM(
        "Round fish",
        "Flat fish",
        "Large pelagic (tuna)",
        "Sharks & rays (cartilage)",
        "Shrimp/prawn",
        "Crab",
        "Lobster",
        "Squid",
        "Cuttlefish",
        "Octopus",
      ),
      allowNull: true,
      defaultValue: null,
    });
  },
};
