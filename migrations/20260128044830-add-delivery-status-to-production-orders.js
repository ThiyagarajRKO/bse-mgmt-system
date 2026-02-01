"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("production_orders", "delivery_status", {
      type: Sequelize.ENUM(
        "Initiated",
        "In Transit",
        "Delivered",
        "dispatched",
      ),
      defaultValue: "Initiated",
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("production_orders", "delivery_status");
  },
};
