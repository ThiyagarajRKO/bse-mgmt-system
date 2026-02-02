"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("species_master", "subcategory");
  },
};
