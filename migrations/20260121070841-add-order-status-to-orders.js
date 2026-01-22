"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "order_status", {
      type: Sequelize.ENUM(
        "DRAFT",
        "CONFIRMED",
        "ALLOCATED",
        "IN_PRODUCTION",
        "READY_FOR_QA",
        "QA_APPROVED",
        "PACKED",
        "READY_FOR_DISPATCH",
        "DISPATCHED",
        "INVOICED",
        "CLOSED",
        "CANCELLED",
      ),
      allowNull: true,
      defaultValue: "DRAFT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orders", "order_status");
  },
};
