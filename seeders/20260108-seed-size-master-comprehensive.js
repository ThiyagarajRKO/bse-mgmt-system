"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEED SIZE MASTER WITH COMPREHENSIVE SIZE RANGES
 *
 * Implements 5 size classification systems:
 * A. Fish (by weight per piece): S, M, L, XL, XXL
 * B. Shrimp/Prawn (count per kg): 16/20, 21/25, 26/30, 31/40, 41/50, 51/60
 * C. Squid/Cuttlefish/Octopus (count OR mantle length): U10, 10/20, 20/40, 2–4, 4–6
 * D. Crab/Lobster (weight per piece): 200–300g, 300–500g, 500–800g, 800+g
 * E. Bivalves/Gastropods (count per kg or shell size): SM, MD, LG, JUMBO
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    try {
      console.log("\n📏 Starting size_master seeding...");

      // Check if sizes already exist
      const existingSizes = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM size_master WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingSizes[0].count > 0) {
        console.log(
          `✅ Size master already has ${existingSizes[0].count} active records, skipping...`
        );
        return;
      }

      const sizes = [
        // ============================================================================
        // A. FISH (by weight per piece) - Used for: Tuna, Salmon, Grouper, Snapper, Cod
        // ============================================================================
        {
          id: uuidv4(),
          size: "S",
          size_category: "FISH",
          unit_of_measure: "g (per piece)",
          min_value: 0,
          max_value: 500,
          description:
            "Small fish: < 500g per piece. Used for small fillets, steaks, portions",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "M",
          size_category: "FISH",
          unit_of_measure: "g (per piece)",
          min_value: 500,
          max_value: 1000,
          description:
            "Medium fish: 500–1000g per piece. Standard size for retail fillets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "L",
          size_category: "FISH",
          unit_of_measure: "kg (per piece)",
          min_value: 1,
          max_value: 2,
          description:
            "Large fish: 1–2kg per piece. Suitable for steaks, whole roasting",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "XL",
          size_category: "FISH",
          unit_of_measure: "kg (per piece)",
          min_value: 2,
          max_value: 4,
          description:
            "Extra Large fish: 2–4kg per piece. Premium whole fish or large steaks",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "XXL",
          size_category: "FISH",
          unit_of_measure: "kg (per piece)",
          min_value: 4,
          max_value: 999,
          description:
            "Jumbo fish: > 4kg per piece. Extra-large whole fish for premium markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // B. SHRIMP / PRAWN (count per kg - industry standard)
        // Used for: Tiger Shrimp, Vannamei, White Prawn
        // ============================================================================
        {
          id: uuidv4(),
          size: "16/20",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 16,
          max_value: 20,
          description:
            "Extra Large shrimp: 16–20 pieces per kg. Premium size for fine dining",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "21/25",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 21,
          max_value: 25,
          description:
            "Large shrimp: 21–25 pieces per kg. Premium export quality",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "26/30",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 26,
          max_value: 30,
          description:
            "Medium shrimp: 26–30 pieces per kg. Standard commercial size",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "31/40",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 31,
          max_value: 40,
          description:
            "Medium-Small shrimp: 31–40 pieces per kg. Good for bulk orders",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "41/50",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 41,
          max_value: 50,
          description:
            "Small shrimp: 41–50 pieces per kg. Economical size for processing",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "51/60",
          size_category: "SHRIMP",
          unit_of_measure: "count/kg",
          min_value: 51,
          max_value: 60,
          description:
            "Very Small shrimp: 51–60 pieces per kg. For surimi, paste, or minced products",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // C. SQUID / CUTTLEFISH / OCTOPUS (count OR mantle length)
        // ============================================================================
        {
          id: uuidv4(),
          size: "U10",
          size_category: "CEPHALOPOD",
          unit_of_measure: "cm (mantle length)",
          min_value: 0,
          max_value: 10,
          description: "Under 10cm squid. Small size for specialty dishes",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "10/20",
          size_category: "CEPHALOPOD",
          unit_of_measure: "cm (mantle length)",
          min_value: 10,
          max_value: 20,
          description: "10–20cm squid. Medium size for rings, steaks",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "20/40",
          size_category: "CEPHALOPOD",
          unit_of_measure: "cm (mantle length)",
          min_value: 20,
          max_value: 40,
          description:
            "20–40cm squid. Large size for whole squid, premium products",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "2-4",
          size_category: "CEPHALOPOD",
          unit_of_measure: "pcs/kg",
          min_value: 2,
          max_value: 4,
          description: "2–4 pieces per kg squid. Large whole squid",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "4-6",
          size_category: "CEPHALOPOD",
          unit_of_measure: "pcs/kg",
          min_value: 4,
          max_value: 6,
          description: "4–6 pieces per kg squid. Medium whole squid",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // D. CRAB / LOBSTER (weight per piece)
        // ============================================================================
        {
          id: uuidv4(),
          size: "200-300",
          size_category: "CRUSTACEAN",
          unit_of_measure: "g (per piece)",
          min_value: 200,
          max_value: 300,
          description:
            "Crab/Lobster: 200–300g per piece. Small size for stir-fry, portions",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "300-500",
          size_category: "CRUSTACEAN",
          unit_of_measure: "g (per piece)",
          min_value: 300,
          max_value: 500,
          description:
            "Crab/Lobster: 300–500g per piece. Medium size for standard servings",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "500-800",
          size_category: "CRUSTACEAN",
          unit_of_measure: "g (per piece)",
          min_value: 500,
          max_value: 800,
          description:
            "Crab/Lobster: 500–800g per piece. Large size for premium markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "800+",
          size_category: "CRUSTACEAN",
          unit_of_measure: "g (per piece)",
          min_value: 800,
          max_value: 9999,
          description:
            "Crab/Lobster: 800g+ (Jumbo). Extra-large for high-end dining",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },

        // ============================================================================
        // E. BIVALVES / GASTROPODS (count per kg or shell size)
        // ============================================================================
        {
          id: uuidv4(),
          size: "SM",
          size_category: "BIVALVE",
          unit_of_measure: "count/kg or shell size",
          min_value: null,
          max_value: null,
          description:
            "Bivalve/Gastropod: Small. Scallops ~100+ pcs/kg, Oysters ~50+ pcs/kg",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "MD",
          size_category: "BIVALVE",
          unit_of_measure: "count/kg or shell size",
          min_value: null,
          max_value: null,
          description:
            "Bivalve/Gastropod: Medium. Standard size for most markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "LG",
          size_category: "BIVALVE",
          unit_of_measure: "count/kg or shell size",
          min_value: null,
          max_value: null,
          description: "Bivalve/Gastropod: Large. Premium size for fine dining",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
        {
          id: uuidv4(),
          size: "JUMBO",
          size_category: "BIVALVE",
          unit_of_measure: "count/kg or shell size",
          min_value: null,
          max_value: null,
          description:
            "Bivalve/Gastropod: Extra Large (Jumbo). Premium/specialty markets",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        },
      ];

      // Get or create a system user first
      let systemUserRecord;
      try {
        const users = await queryInterface.sequelize.query(
          "SELECT id FROM user_profile LIMIT 1",
          { type: Sequelize.QueryTypes.SELECT }
        );
        if (users.length > 0) {
          systemUserRecord = users[0].id;
        } else {
          // Create a system user if none exists
          const result = await queryInterface.sequelize.query(
            `INSERT INTO user_profile (id, name, email, phone, is_active, created_at, updated_at)
             VALUES ('00000000-0000-0000-0000-000000000000', 'System User', 'system@bse.local', '0000000000', true, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING
             RETURNING id;`,
            { type: Sequelize.QueryTypes.SELECT }
          );
          systemUserRecord =
            result.length > 0
              ? result[0].id
              : "00000000-0000-0000-0000-000000000000";
        }
      } catch (err) {
        console.log("⚠️  Could not verify system user, using default UUID");
        systemUserRecord = systemUserId;
      }

      // Update sizes with actual system user ID
      sizes.forEach((size) => {
        size.created_by = systemUserRecord;
        size.updated_by = systemUserRecord;
      });

      // Insert sizes
      await queryInterface.bulkInsert("size_master", sizes, {});

      console.log(
        `✅ Inserted ${sizes.length} size records across 5 categories:`
      );
      console.log(`   📎 Fish (S, M, L, XL, XXL) - 5 sizes`);
      console.log(`   🦐 Shrimp (16/20 to 51/60) - 6 sizes`);
      console.log(`   🦑 Cephalopod (U10, 10/20, 20/40, 2-4, 4-6) - 5 sizes`);
      console.log(`   🦀 Crustacean (200-300g to 800+g) - 4 sizes`);
      console.log(`   🐚 Bivalve (SM, MD, LG, JUMBO) - 4 sizes`);
      console.log("\n");
    } catch (error) {
      console.error("❌ Error seeding size_master:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing size_master seeded data...");

      // Delete by size codes
      const sizeCodes = [
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "16/20",
        "21/25",
        "26/30",
        "31/40",
        "41/50",
        "51/60",
        "U10",
        "10/20",
        "20/40",
        "2-4",
        "4-6",
        "200-300",
        "300-500",
        "500-800",
        "800+",
        "SM",
        "MD",
        "LG",
        "JUMBO",
      ];

      for (const sizeCode of sizeCodes) {
        await queryInterface.sequelize.query(
          `DELETE FROM size_master WHERE size = ?`,
          {
            replacements: [sizeCode],
            type: Sequelize.QueryTypes.DELETE,
          }
        );
      }

      console.log("✅ Removed size_master seeded data");
    } catch (error) {
      console.error("Error removing size_master seeded data:", error);
      throw error;
    }
  },
};
