"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add order_id to peeling table
    await queryInterface.addColumn("peeling", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Reference to the sales order for which this peeling is done",
    });

    // Add index for faster queries
    await queryInterface.addIndex("peeling", ["order_id"], {
      name: "peeling_order_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("peeling", "peeling_order_id_idx");
    await queryInterface.removeColumn("peeling", "order_id");
  },
};
