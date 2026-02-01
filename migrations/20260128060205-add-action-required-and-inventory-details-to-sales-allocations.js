"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_allocations", "action_required", {
      type: Sequelize.ENUM(
        "DISPATCH",
        "BEGIN_PRODUCTION",
        "RAISE_PURCHASE_REQUEST",
      ),
      allowNull: true,
    });

    await queryInterface.addColumn("sales_allocations", "inventory_details", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("sales_allocations", "action_required");
    await queryInterface.removeColumn("sales_allocations", "inventory_details");
  },
};
