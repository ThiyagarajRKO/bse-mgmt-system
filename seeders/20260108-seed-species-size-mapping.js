"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEED SPECIES-SIZE MAPPING
 *
 * Maps each species category to appropriate size unit_of_measure values
 * Defines priority order for size recommendations
 *
 * Mappings:
 * - Fish → g (per piece): S, M, L, XL, XXL
 * - Crustacean → count/kg: 16/20, 21/25, 26/30, 31/40, 41/50, 51/60 (Shrimp)
 * - Crustacean → g (per piece): 200-300, 300-500, 500-800, 800+ (Crab/Lobster)
 * - Cephalopod → cm or pcs/kg: U10, 10/20, 20/40, 2-4, 4-6
 * - Bivalve → count/kg or shell size: SM, MD, LG, JUMBO
 * - Gastropod → count/kg or shell size: SM, MD, LG, JUMBO
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    try {
      console.log("\n🔗 Starting species-size mapping seeding...");

      // Check if mappings already exist
      const existingMappings = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM species_size_mapping WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingMappings[0].count > 0) {
        console.log(
          `✅ Species-size mapping already has ${existingMappings[0].count} active records, skipping...`
        );
        return;
      }

      const mappings = [
        // ============================================================================
        // FISH → Weight per piece (g or kg)
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Fish",
          unit_of_measure: "g (per piece)",
          priority: 1,
          description:
            "Fish are sized by weight per piece (grams for small/medium, kg for large)",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          parent_category_type: "Fish",
          unit_of_measure: "kg (per piece)",
          priority: 2,
          description: "Large fish measured in kilograms",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // CRUSTACEAN → Shrimp (count/kg - industry standard)
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Crustacean",
          unit_of_measure: "count/kg",
          priority: 1,
          description:
            "Shrimp/Prawn are sized by count per kilogram (industry standard)",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // CRUSTACEAN → Crab/Lobster (weight per piece)
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Crustacean",
          unit_of_measure: "g (per piece)",
          priority: 2,
          description: "Crab/Lobster are sized by weight per individual piece",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // CEPHALOPOD → Mantle length (cm) or Count per kg
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Cephalopod",
          unit_of_measure: "cm (mantle length)",
          priority: 1,
          description:
            "Squid/Cuttlefish/Octopus sized by mantle length in centimeters",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          parent_category_type: "Cephalopod",
          unit_of_measure: "pcs/kg",
          priority: 2,
          description:
            "Squid/Cuttlefish sized by whole piece count per kilogram",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // BIVALVE → Count per kg or Shell size (SM, MD, LG, JUMBO)
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Bivalve",
          unit_of_measure: "count/kg or shell size",
          priority: 1,
          description:
            "Scallops, Oysters, Clams sized by count per kg or shell diameter",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // GASTROPOD → Count per kg or Shell size (SM, MD, LG, JUMBO)
        // ============================================================================
        {
          id: uuidv4(),
          parent_category_type: "Gastropod",
          unit_of_measure: "count/kg or shell size",
          priority: 1,
          description:
            "Conch, Abalone, Snails sized by count per kg or shell size",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ];

      await queryInterface.bulkInsert("species_size_mapping", mappings, {});

      console.log(
        `✅ Inserted ${mappings.length} species-size mapping records:`
      );
      console.log(`   🐟 Fish → g/kg (per piece) - 2 mappings`);
      console.log(
        `   🦐 Crustacean → count/kg (Shrimp) + g/piece (Crab) - 2 mappings`
      );
      console.log(`   🦑 Cephalopod → cm (mantle) + pcs/kg - 2 mappings`);
      console.log(`   🐚 Bivalve → count/kg or shell size - 1 mapping`);
      console.log(`   🐢 Gastropod → count/kg or shell size - 1 mapping`);
      console.log("\n");
    } catch (error) {
      console.error("❌ Error seeding species_size_mapping:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing species-size mapping seeded data...");

      const categories = [
        "Fish",
        "Crustacean",
        "Cephalopod",
        "Bivalve",
        "Gastropod",
      ];

      for (const category of categories) {
        await queryInterface.sequelize.query(
          `DELETE FROM species_size_mapping WHERE parent_category_type = ?`,
          {
            replacements: [category],
            type: Sequelize.QueryTypes.DELETE,
          }
        );
      }

      console.log("✅ Removed species-size mapping seeded data");
    } catch (error) {
      console.error("Error removing species-size mapping seeded data:", error);
      throw error;
    }
  },
};
