"use strict";

/**
 * Add BOM Indexes for Performance
 *
 * Ensures BOM queries are fast by adding composite indexes
 * on commonly queried combinations
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("\n📋 Adding BOM Performance Indexes...\n");

    try {
      // Check if tables exist
      const tables = await queryInterface.showAllTables();
      if (!tables.includes("bill_of_materials")) {
        console.log("⚠️  bill_of_materials table does not exist, skipping...");
        return;
      }

      // Index 1: product_master_id + is_active (most common query)
      console.log("  1️⃣  Adding index for BOM lookup by finished product...");
      try {
        await queryInterface.addIndex(
          "bill_of_materials",
          ["product_master_id", "is_active"],
          {
            name: "idx_bom_product_active",
            unique: false,
          },
        );
        console.log("     ✅ Created idx_bom_product_active");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("     ⚠️  Index already exists");
        } else {
          throw err;
        }
      }

      // Index 2: procurement_product_id + is_active (coverage checks)
      console.log("  2️⃣  Adding index for BOM lookup by raw material...");
      try {
        await queryInterface.addIndex(
          "bill_of_materials",
          ["procurement_product_id", "is_active"],
          {
            name: "idx_bom_procurement_active",
            unique: false,
          },
        );
        console.log("     ✅ Created idx_bom_procurement_active");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("     ⚠️  Index already exists");
        } else {
          throw err;
        }
      }

      // Index 3: product_master_id + procurement_product_id (uniqueness check)
      console.log("  3️⃣  Adding index for BOM uniqueness check...");
      try {
        await queryInterface.addIndex(
          "bill_of_materials",
          ["product_master_id", "procurement_product_id"],
          {
            name: "idx_bom_unique_link",
            unique: false,
          },
        );
        console.log("     ✅ Created idx_bom_unique_link");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("     ⚠️  Index already exists");
        } else {
          throw err;
        }
      }

      console.log("\n✅ BOM Performance Indexes Complete!\n");
    } catch (error) {
      console.error("\n❌ Error adding BOM indexes:", error.message);
      throw error;
    }
  },

  async down(queryInterface) {
    console.log("\n🗑️  Removing BOM Performance Indexes...\n");

    try {
      const indexes = [
        "idx_bom_product_active",
        "idx_bom_procurement_active",
        "idx_bom_unique_link",
      ];

      for (const index of indexes) {
        try {
          await queryInterface.removeIndex("bill_of_materials", index);
          console.log(`  ✅ Removed ${index}`);
        } catch (err) {
          if (err.message.includes("does not exist")) {
            console.log(`  ⚠️  ${index} does not exist`);
          } else {
            throw err;
          }
        }
      }

      console.log("\n✅ Index removal complete!\n");
    } catch (error) {
      console.error("\n❌ Error removing indexes:", error.message);
      throw error;
    }
  },
};
