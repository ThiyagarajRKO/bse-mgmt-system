"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make customer_id nullable in profitability_fact table
    await queryInterface.changeColumn("profitability_fact", "customer_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "customer_master",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert customer_id back to NOT NULL
    await queryInterface.changeColumn("profitability_fact", "customer_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "customer_master",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },
};
