"use strict";

/**
 * Create Bill of Materials Table
 *
 * Links finished products to raw materials via procurement products
 * This is the legacy BOM system used by check_inventory handler
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n📋 Creating bill_of_materials table...\n");

    const existingTables = await queryInterface.showAllTables();

    if (existingTables.includes("bill_of_materials")) {
      console.log("⚠️  Table bill_of_materials already exists, skipping...");
      return;
    }

    await queryInterface.createTable("bill_of_materials", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_master_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "product_master",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Finished product (processed product)",
      },
      procurement_product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "procurement_products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Raw material via procurement product",
      },
      quantity_required: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Raw material quantity required per finished unit",
      },
      unit_of_measure: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "kg",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    console.log("✅ Created bill_of_materials table\n");

    // Create indexes for common queries
    await queryInterface.addIndex("bill_of_materials", ["product_master_id"], {
      name: "idx_bom_product_master",
    });
    await queryInterface.addIndex(
      "bill_of_materials",
      ["procurement_product_id"],
      {
        name: "idx_bom_procurement_product",
      },
    );
    await queryInterface.addIndex("bill_of_materials", ["is_active"], {
      name: "idx_bom_active",
    });

    console.log("✅ Created indexes for bill_of_materials\n");
  },

  async down(queryInterface) {
    console.log("\n🗑️  Dropping bill_of_materials table...\n");
    await queryInterface.dropTable("bill_of_materials", { cascade: true });
    console.log("✅ Dropped bill_of_materials table\n");
  },
};
