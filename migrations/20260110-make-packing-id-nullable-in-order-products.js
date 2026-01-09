"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make packing_id nullable to allow orders without packing records
    // This enables direct product selection from ProductMaster
    await queryInterface.changeColumn("order_products", "packing_id", {
      type: Sequelize.UUID,
      allowNull: true, // Changed from false to true
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      references: {
        model: { tableName: "packing" },
        key: "id",
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: make packing_id non-nullable again
    await queryInterface.changeColumn("order_products", "packing_id", {
      type: Sequelize.UUID,
      allowNull: false,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      references: {
        model: { tableName: "packing" },
        key: "id",
      },
    });
  },
};
