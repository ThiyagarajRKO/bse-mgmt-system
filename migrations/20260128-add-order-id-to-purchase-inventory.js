"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableDescription =
      await queryInterface.describeTable("purchase_inventory");

    if (!tableDescription.order_id) {
      await queryInterface.addColumn("purchase_inventory", "order_id", {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
        references: {
          model: { tableName: "orders" },
          key: "id",
        },
      });

      await queryInterface.addIndex("purchase_inventory", ["order_id"], {
        name: "purchase_inventory_order_id_idx",
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      "purchase_inventory",
      "purchase_inventory_order_id_idx",
    );
    await queryInterface.removeColumn("purchase_inventory", "order_id");
  },
};
