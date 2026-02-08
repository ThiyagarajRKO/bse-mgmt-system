"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add available_stock field to purchase_inventory table
    // available_stock = quantity - reserved_quantity (for pending purchase requests)
    await queryInterface.addColumn("purchase_inventory", "available_stock", {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: true,
      comment:
        "Available stock after deducting reserved quantities for pending purchase requests",
    });

    // Also add reserved_quantity to track how much is reserved for purchase requests
    await queryInterface.addColumn("purchase_inventory", "reserved_quantity", {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      allowNull: true,
      comment: "Quantity reserved for pending purchase requests",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the migration by removing the columns
    await queryInterface.removeColumn("purchase_inventory", "available_stock");
    await queryInterface.removeColumn(
      "purchase_inventory",
      "reserved_quantity",
    );
  },
};
