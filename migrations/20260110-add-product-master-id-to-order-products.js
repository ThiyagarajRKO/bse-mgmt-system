"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add product_master_id column to order_products for direct product selection
    const tableDescription = await queryInterface.describeTable(
      "order_products"
    );

    if (!tableDescription.product_master_id) {
      await queryInterface.addColumn("order_products", "product_master_id", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: "product_master" },
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove product_master_id column
    const tableDescription = await queryInterface.describeTable(
      "order_products"
    );

    if (tableDescription.product_master_id) {
      await queryInterface.removeColumn("order_products", "product_master_id");
    }
  },
};
