"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the delivery_status enum to include "Initiated" and set it as default
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_peeled_dispatches_delivery_status" ADD VALUE IF NOT EXISTS 'Initiated';
    `);

    // Change the default value to 'Initiated'
    await queryInterface.changeColumn("peeled_dispatches", "delivery_status", {
      type: Sequelize.ENUM("Initiated", "In Transit", "Delivered"),
      defaultValue: "Initiated",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to 'In Transit' as default
    await queryInterface.changeColumn("peeled_dispatches", "delivery_status", {
      type: Sequelize.ENUM("Initiated", "In Transit", "Delivered"),
      defaultValue: "In Transit",
    });
  },
};
