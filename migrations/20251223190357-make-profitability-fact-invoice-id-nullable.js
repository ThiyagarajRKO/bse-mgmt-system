"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make invoice_id nullable in profitability_fact table
    await queryInterface.changeColumn("profitability_fact", "invoice_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert invoice_id back to NOT NULL
    await queryInterface.changeColumn("profitability_fact", "invoice_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
