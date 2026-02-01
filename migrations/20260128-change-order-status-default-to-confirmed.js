"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change default value of order_status from DRAFT to CONFIRMED
    await queryInterface.changeColumn("orders", "order_status", {
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
      defaultValue: "CONFIRMED",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to DRAFT as default
    await queryInterface.changeColumn("orders", "order_status", {
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
};
