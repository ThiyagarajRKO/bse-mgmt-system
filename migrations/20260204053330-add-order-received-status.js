"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First add ORDER_RECEIVED to the enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_orders_order_status" ADD VALUE 'ORDER_RECEIVED';
    `);

    // Then change the default value
    await queryInterface.changeColumn("orders", "order_status", {
      type: Sequelize.ENUM(
        "ORDER_RECEIVED",
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
      defaultValue: "ORDER_RECEIVED",
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // We'll just change the default back to CONFIRMED
    await queryInterface.changeColumn("orders", "order_status", {
      type: Sequelize.ENUM(
        "ORDER_RECEIVED",
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
};
