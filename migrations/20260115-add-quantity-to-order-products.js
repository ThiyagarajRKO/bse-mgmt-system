"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add quantity column
    await queryInterface.addColumn("order_products", "quantity", {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      comment: "Quantity of products ordered (renamed from unit)",
    });

    // Migrate data from unit to quantity
    await queryInterface.sequelize.query(`
      UPDATE order_products 
      SET quantity = unit
      WHERE quantity IS NULL OR quantity = 0
    `);

    // Add index for query performance
    await queryInterface.addIndex("order_products", ["order_id"], {
      name: "order_products_order_id_idx",
    });

    console.log("✓ Added quantity column and migrated data from unit");
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the quantity column
    await queryInterface.removeIndex(
      "order_products",
      "order_products_order_id_idx"
    );
    await queryInterface.removeColumn("order_products", "quantity");
  },
};
