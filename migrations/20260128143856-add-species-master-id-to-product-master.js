"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_master", "species_master_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "species_master",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("product_master", "species_master_id");
  },
};
