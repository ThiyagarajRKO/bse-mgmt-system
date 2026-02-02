"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add available_quantity to sales_inventory table
    await queryInterface.addColumn("sales_inventory", "available_quantity", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Available quantity for sales (quantity - reserved/sold)",
    });

    // Add available_quantity to purchase_inventory table
    await queryInterface.addColumn("purchase_inventory", "available_quantity", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Available quantity for production (quantity - consumed)",
    });

    // Add gst_master_id to product_master table
    await queryInterface.addColumn("product_master", "gst_master_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "consolidated_gst_master",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Reference to GST master for tax calculations",
    });

    // Set default values for existing records
    await queryInterface.sequelize.query(`
      UPDATE sales_inventory 
      SET available_quantity = quantity 
      WHERE available_quantity = 0 OR available_quantity IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE purchase_inventory 
      SET available_quantity = quantity 
      WHERE available_quantity = 0 OR available_quantity IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn("sales_inventory", "available_quantity");
    await queryInterface.removeColumn(
      "purchase_inventory",
      "available_quantity",
    );
    await queryInterface.removeColumn("product_master", "gst_master_id");
  },
};
