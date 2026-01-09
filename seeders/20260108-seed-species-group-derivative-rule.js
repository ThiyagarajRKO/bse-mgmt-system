"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Seed species_group_derivative_rule Table
 *
 * Complete yield rules for 10 species groups with all derivatives
 * Includes: pieces per unit, yield range, priority, and loss category
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Step 1: Fetch species IDs (using representative species from each group)
      const speciesMap = await queryInterface.sequelize.query(
        `SELECT id, species_name, species_code FROM species_master WHERE is_active = true LIMIT 20`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Create a map of species groups to their IDs
      const speciesGroupMap = {};

      // Group species by type
      speciesMap.forEach((sp) => {
        const code = sp.species_code?.toUpperCase() || "";

        if (
          code.includes("SALMON") ||
          code.includes("HILSA") ||
          code.includes("TROUT")
        ) {
          speciesGroupMap["ROUND_FISH"] = sp.id;
        } else if (
          code.includes("FLATFISH") ||
          code.includes("SOLE") ||
          code.includes("FLOUNDER")
        ) {
          speciesGroupMap["FLAT_FISH"] = sp.id;
        } else if (code.includes("TUNA") || code.includes("MACKEREL")) {
          speciesGroupMap["PELAGIC_LARGE"] = sp.id;
        } else if (code.includes("SHRIMP") || code.includes("PRAWN")) {
          speciesGroupMap["SHRIMP"] = sp.id;
        } else if (code.includes("CRAB")) {
          speciesGroupMap["CRAB"] = sp.id;
        } else if (code.includes("LOBSTER")) {
          speciesGroupMap["LOBSTER"] = sp.id;
        } else if (code.includes("SQUID") || code.includes("CUTTLEFISH")) {
          speciesGroupMap["SQUID_CUTTLEFISH"] = sp.id;
        } else if (code.includes("OCTOPUS")) {
          speciesGroupMap["OCTOPUS"] = sp.id;
        } else if (
          code.includes("OYSTER") ||
          code.includes("SCALLOP") ||
          code.includes("CLAM")
        ) {
          speciesGroupMap["BIVALVE"] = sp.id;
        } else if (code.includes("CONCH") || code.includes("SNAIL")) {
          speciesGroupMap["GASTROPOD"] = sp.id;
        }
      });

      // Step 2: Fetch derivative IDs
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_code FROM derivative_master WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const derivativeMap = {};
      derivatives.forEach((d) => {
        derivativeMap[d.derivative_code] = d.id;
      });

      console.log("Species Groups Found:", Object.keys(speciesGroupMap).length);
      console.log("Derivatives Available:", Object.keys(derivativeMap).length);

      // Step 3: Define yield rules for each species group
      const yieldRules = [
        // ========== ROUND FISH (Salmon, Hilsa, Trout, Tilapia, Carp, Catfish) ==========
        ...(speciesGroupMap["ROUND_FISH"]
          ? [
              {
                species_group_id: speciesGroupMap["ROUND_FISH"],
                derivative_id: derivativeMap["RAW_FILLET"],
                pieces_per_unit: 2,
                yield_min: 38,
                yield_max: 45,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["ROUND_FISH"],
                derivative_id:
                  derivativeMap["RAW_WINGS"] || derivativeMap["RAW_WINGS"],
                pieces_per_unit: 2,
                yield_min: 6,
                yield_max: 10,
                priority_order: 2,
                loss_category: "SECONDARY",
              },
              {
                species_group_id: speciesGroupMap["ROUND_FISH"],
                derivative_id: derivativeMap["RAW_STEAKS"],
                pieces_per_unit: 1,
                yield_min: 15,
                yield_max: 25,
                priority_order: 3,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["ROUND_FISH"],
                derivative_id: derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 3,
                yield_max: 6,
                priority_order: 4,
                loss_category: "TRIM",
              },
              {
                species_group_id: speciesGroupMap["ROUND_FISH"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== FLAT FISH (Sole, Flounder, Plaice) ==========
        ...(speciesGroupMap["FLAT_FISH"]
          ? [
              {
                species_group_id: speciesGroupMap["FLAT_FISH"],
                derivative_id: derivativeMap["RAW_FILLET"],
                pieces_per_unit: 4,
                yield_min: 48,
                yield_max: 55,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["FLAT_FISH"],
                derivative_id: derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 8,
                yield_max: 12,
                priority_order: 2,
                loss_category: "TRIM",
              },
              {
                species_group_id: speciesGroupMap["FLAT_FISH"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== TUNA / PELAGIC LARGE (Tuna, Mackerel) ==========
        ...(speciesGroupMap["PELAGIC_LARGE"]
          ? [
              {
                species_group_id: speciesGroupMap["PELAGIC_LARGE"],
                derivative_id:
                  derivativeMap["RAW_LOINS"] || derivativeMap["RAW_STEAKS"],
                pieces_per_unit: 4,
                yield_min: 50,
                yield_max: 60,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["PELAGIC_LARGE"],
                derivative_id:
                  derivativeMap["RAW_BELLY"] || derivativeMap["RAW_TRIM"],
                pieces_per_unit: 2,
                yield_min: 8,
                yield_max: 12,
                priority_order: 2,
                loss_category: "SECONDARY",
              },
              {
                species_group_id: speciesGroupMap["PELAGIC_LARGE"],
                derivative_id: derivativeMap["RAW_STEAKS"],
                pieces_per_unit: 1,
                yield_min: 15,
                yield_max: 20,
                priority_order: 3,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["PELAGIC_LARGE"],
                derivative_id: derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 5,
                yield_max: 8,
                priority_order: 4,
                loss_category: "TRIM",
              },
              {
                species_group_id: speciesGroupMap["PELAGIC_LARGE"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== SHRIMP / PRAWN ==========
        ...(speciesGroupMap["SHRIMP"]
          ? [
              {
                species_group_id: speciesGroupMap["SHRIMP"],
                derivative_id: derivativeMap["RAW_WHOLE_ROUND"],
                pieces_per_unit: 1,
                yield_min: 95,
                yield_max: 100,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["SHRIMP"],
                derivative_id: derivativeMap["SEMI_PD"],
                pieces_per_unit: 1,
                yield_min: 55,
                yield_max: 62,
                priority_order: 2,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["SHRIMP"],
                derivative_id: derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 65,
                yield_max: 72,
                priority_order: 3,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["SHRIMP"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== CRAB ==========
        ...(speciesGroupMap["CRAB"]
          ? [
              {
                species_group_id: speciesGroupMap["CRAB"],
                derivative_id:
                  derivativeMap["SEMI_MEAT_ONLY"] ||
                  derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 25,
                yield_max: 35,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["CRAB"],
                derivative_id:
                  derivativeMap["BYPRODUCT_SHELL"] ||
                  derivativeMap["BYPRODUCT_MEAL"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== LOBSTER ==========
        ...(speciesGroupMap["LOBSTER"]
          ? [
              {
                species_group_id: speciesGroupMap["LOBSTER"],
                derivative_id:
                  derivativeMap["SEMI_MEAT_ONLY"] || derivativeMap["RAW_TAIL"],
                pieces_per_unit: 1,
                yield_min: 18,
                yield_max: 22,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["LOBSTER"],
                derivative_id:
                  derivativeMap["RAW_CLAWS"] || derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 2,
                yield_min: 10,
                yield_max: 15,
                priority_order: 2,
                loss_category: "SECONDARY",
              },
              {
                species_group_id: speciesGroupMap["LOBSTER"],
                derivative_id:
                  derivativeMap["BYPRODUCT_SHELL"] ||
                  derivativeMap["BYPRODUCT_MEAL"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== SQUID / CUTTLEFISH ==========
        ...(speciesGroupMap["SQUID_CUTTLEFISH"]
          ? [
              {
                species_group_id: speciesGroupMap["SQUID_CUTTLEFISH"],
                derivative_id: derivativeMap["RAW_TUBE"],
                pieces_per_unit: 1,
                yield_min: 55,
                yield_max: 65,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["SQUID_CUTTLEFISH"],
                derivative_id: derivativeMap["RAW_TENTACLE"],
                pieces_per_unit: 1,
                yield_min: 15,
                yield_max: 20,
                priority_order: 2,
                loss_category: "SECONDARY",
              },
              {
                species_group_id: speciesGroupMap["SQUID_CUTTLEFISH"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== OCTOPUS ==========
        ...(speciesGroupMap["OCTOPUS"]
          ? [
              {
                species_group_id: speciesGroupMap["OCTOPUS"],
                derivative_id: derivativeMap["RAW_WHOLE_ROUND"],
                pieces_per_unit: 1,
                yield_min: 80,
                yield_max: 88,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["OCTOPUS"],
                derivative_id: derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 5,
                yield_max: 8,
                priority_order: 2,
                loss_category: "TRIM",
              },
              {
                species_group_id: speciesGroupMap["OCTOPUS"],
                derivative_id:
                  derivativeMap["BYPRODUCT_MEAL"] || derivativeMap["RAW_WASTE"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== BIVALVE (Oyster, Scallop, Clam, Mussel) ==========
        ...(speciesGroupMap["BIVALVE"]
          ? [
              {
                species_group_id: speciesGroupMap["BIVALVE"],
                derivative_id:
                  derivativeMap["SEMI_MEAT_ONLY"] ||
                  derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 18,
                yield_max: 35,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["BIVALVE"],
                derivative_id:
                  derivativeMap["BYPRODUCT_SHELL"] ||
                  derivativeMap["BYPRODUCT_MEAL"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),

        // ========== GASTROPOD (Conch, Abalone, Snail) ==========
        ...(speciesGroupMap["GASTROPOD"]
          ? [
              {
                species_group_id: speciesGroupMap["GASTROPOD"],
                derivative_id:
                  derivativeMap["SEMI_MEAT_ONLY"] ||
                  derivativeMap["SEMI_MINCED"],
                pieces_per_unit: 1,
                yield_min: 18,
                yield_max: 35,
                priority_order: 1,
                loss_category: "PRIMARY",
              },
              {
                species_group_id: speciesGroupMap["GASTROPOD"],
                derivative_id:
                  derivativeMap["BYPRODUCT_SHELL"] ||
                  derivativeMap["BYPRODUCT_MEAL"],
                pieces_per_unit: 1,
                yield_min: 0,
                yield_max: 100,
                priority_order: 99,
                loss_category: "WASTE",
              },
            ]
          : []),
      ];

      // Filter out empty rules and add UUIDs
      const rulesWithIds = yieldRules
        .filter((r) => r.derivative_id && r.species_group_id)
        .map((r) => ({
          id: uuidv4(),
          ...r,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }));

      console.log(
        `Inserting ${rulesWithIds.length} yield rules into species_group_derivative_rule...`
      );

      if (rulesWithIds.length > 0) {
        await queryInterface.bulkInsert(
          "species_group_derivative_rule",
          rulesWithIds,
          { ignoreDuplicates: true }
        );
      }

      console.log(`✅ Successfully seeded ${rulesWithIds.length} yield rules`);
    } catch (error) {
      console.error(
        "Error seeding species_group_derivative_rule:",
        error?.message || error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete(
        "species_group_derivative_rule",
        null,
        {}
      );
      console.log("✅ Cleared all yield rules");
    } catch (error) {
      console.error("Error clearing yield rules:", error);
      throw error;
    }
  },
};
