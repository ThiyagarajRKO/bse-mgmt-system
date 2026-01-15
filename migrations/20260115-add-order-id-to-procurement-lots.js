"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add order_id to procurement_lots
    await queryInterface.addColumn("procurement_lots", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment:
        "Reference to the sales order for which this procurement is made",
    });

    // Add index for faster queries
    await queryInterface.addIndex("procurement_lots", ["order_id"], {
      name: "procurement_lots_order_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "procurement_lots",
      "procurement_lots_order_id_idx"
    );
    await queryInterface.removeColumn("procurement_lots", "order_id");
  },
};
