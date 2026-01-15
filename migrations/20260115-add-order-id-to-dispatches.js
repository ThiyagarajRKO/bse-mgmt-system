"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("dispatches", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Reference to the sales order for which this dispatch is made",
    });

    // Add index for faster queries
    await queryInterface.addIndex("dispatches", ["order_id"], {
      name: "dispatches_order_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("dispatches", "dispatches_order_id_idx");
    await queryInterface.removeColumn("dispatches", "order_id");
  },
};
