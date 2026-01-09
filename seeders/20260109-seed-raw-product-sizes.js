"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEEDER: Raw Product Sizes
 * ===========================
 * This seeder creates the size master entries required for RAW products.
 * These are fixed size categories for raw seafood (whole, unprocessed).
 *
 * Includes:
 * - Gram-based sizes (for fish, crustaceans)
 * - Cm-based sizes (for squid, octopus)
 * - Count-based sizes (for shrimp, scallops)
 * - UNSIZED bucket (for intake flexibility)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n🍣 Seeding RAW product sizes...");

      // Check if already seeded
      const existingRawSizes = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM size_master WHERE size IN ('300_500G', '500_1KG', 'UNSIZED')",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingRawSizes[0].count > 0) {
        console.log("✅ RAW product sizes already seeded, skipping...\n");
        return;
      }

      const systemUserId = "87ffbaff-b7e9-4198-90d2-0fa12d85ef82";
      const now = new Date();

      const rawSizes = [
        // ========================================
        // FISH & CRUSTACEANS (Gram-based)
        // ========================================
        {
          id: uuidv4(),
          size: "200_300G",
          size_category: "RAW",
          unit_of_measure: "g (per piece)",
          description: "Small whole fish/crustacean: 200–300g per piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "300_500G",
          size_category: "RAW",
          unit_of_measure: "g (per piece)",
          description: "Medium whole fish/crustacean: 300–500g per piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "500_1KG",
          size_category: "RAW",
          unit_of_measure: "g (per piece)",
          description: "Large whole fish: 500g–1kg per piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "1_2KG",
          size_category: "RAW",
          unit_of_measure: "kg (per piece)",
          description: "Extra large whole fish: 1–2kg per piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "2_3KG",
          size_category: "RAW",
          unit_of_measure: "kg (per piece)",
          description: "Jumbo whole fish: 2–3kg per piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "3UP_KG",
          size_category: "RAW",
          unit_of_measure: "kg (per piece)",
          description:
            "Super jumbo whole fish: >3kg per piece (tuna, large grouper)",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },

        // ========================================
        // SQUID & CEPHALOPODS (CM-based)
        // ========================================
        {
          id: uuidv4(),
          size: "10_20CM",
          size_category: "RAW",
          unit_of_measure: "cm (mantle length)",
          description: "Small squid/octopus: 10–20cm mantle length",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "20_30CM",
          size_category: "RAW",
          unit_of_measure: "cm (mantle length)",
          description: "Medium squid/octopus: 20–30cm mantle length",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "30UP_CM",
          size_category: "RAW",
          unit_of_measure: "cm (mantle length)",
          description: "Large squid/octopus: >30cm mantle length",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },

        // ========================================
        // SHRIMP & BIVALVES (Count/KG)
        // ========================================
        {
          id: uuidv4(),
          size: "16_20_COUNT",
          size_category: "RAW",
          unit_of_measure: "count/kg",
          description: "Extra large shrimp: 16–20 pieces per kg",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "21_25_COUNT",
          size_category: "RAW",
          unit_of_measure: "count/kg",
          description: "Large shrimp: 21–25 pieces per kg",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          size: "26_30_COUNT",
          size_category: "RAW",
          unit_of_measure: "count/kg",
          description: "Medium shrimp: 26–30 pieces per kg",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },

        // ========================================
        // UNSIZED BUCKET (Intake flexibility)
        // ========================================
        {
          id: uuidv4(),
          size: "UNSIZED",
          size_category: "RAW",
          unit_of_measure: "kg (mixed)",
          description:
            "UNSIZED raw material bucket. Used ONLY for intake/landing. Must be sorted before production or sales.",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
      ];

      // Insert sizes
      await queryInterface.bulkInsert("size_master", rawSizes, {});

      console.log(`✅ Inserted ${rawSizes.length} RAW product sizes:`);
      console.log("   📏 Fish/Crustaceans (gram-based): 6 sizes");
      console.log("   🦑 Squid/Cephalopods (cm-based): 3 sizes");
      console.log("   🦐 Shrimp/Bivalves (count/kg): 3 sizes");
      console.log("   📦 UNSIZED bucket: 1 size\n");
    } catch (error) {
      console.error("❌ Error seeding RAW product sizes:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Removing RAW product sizes...");

      await queryInterface.bulkDelete("size_master", {
        size: [
          "300_500G",
          "500_1KG",
          "1_2KG",
          "2_3KG",
          "3UP_KG",
          "10_20CM",
          "20_30CM",
          "30UP_CM",
          "16_20_COUNT",
          "21_25_COUNT",
          "26_30_COUNT",
          "200_300G",
          "UNSIZED",
        ],
      });

      console.log("✅ RAW product sizes removed\n");
    } catch (error) {
      console.error("❌ Error removing RAW product sizes:", error.message);
      throw error;
    }
  },
};
