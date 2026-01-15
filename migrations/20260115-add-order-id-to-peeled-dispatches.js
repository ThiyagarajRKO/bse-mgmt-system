"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add order_id to peeled_dispatches table
    await queryInterface.addColumn("peeled_dispatches", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment:
        "Reference to the sales order for which this peeled dispatch is made",
    });

    // Add index for faster queries
    await queryInterface.addIndex("peeled_dispatches", ["order_id"], {
      name: "peeled_dispatches_order_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "peeled_dispatches",
      "peeled_dispatches_order_id_idx"
    );
    await queryInterface.removeColumn("peeled_dispatches", "order_id");
  },
};
