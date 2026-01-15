"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add order_id to procurement_products
    await queryInterface.addColumn("procurement_products", "order_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: { tableName: "orders" },
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment:
        "Reference to the sales order for which this procurement product is allocated",
    });

    // Add index for faster queries
    await queryInterface.addIndex("procurement_products", ["order_id"], {
      name: "procurement_products_order_id_idx",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "procurement_products",
      "procurement_products_order_id_idx"
    );
    await queryInterface.removeColumn("procurement_products", "order_id");
  },
};
