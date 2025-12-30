"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Increase sku_code column length from VARCHAR(50) to VARCHAR(255)
    await queryInterface.changeColumn("profitability_fact", "sku_code", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert sku_code column length back to VARCHAR(50)
    await queryInterface.changeColumn("profitability_fact", "sku_code", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });
  },
};
