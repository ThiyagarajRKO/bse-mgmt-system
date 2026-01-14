"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("packing", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("packing", "order_id");
  },
};
