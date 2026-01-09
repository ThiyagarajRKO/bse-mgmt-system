"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEED SPECIES-DERIVATIVE-SIZE MAPPING MATRIX
 *
 * Creates a comprehensive lookup mapping:
 * Species Group → Derivatives → Appropriate Sizes
 *
 * This enables:
 * - Product creation with automatic size recommendations
 * - Yield calculations with size-aware outputs
 * - Pricing optimization by species, derivative, and size
 * - Inventory tracking by all three dimensions
 * - Production planning with complete visibility
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    try {
      console.log("\n🔗 Starting species-derivative-size mapping seeding...");

      // Check if mappings already exist
      const existingMappings = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM species_derivative_size_mapping WHERE is_active = true",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingMappings && existingMappings[0].count > 0) {
        console.log(
          `✅ Species-derivative-size mapping already has ${existingMappings[0].count} active records, skipping...`
        );
        return;
      }

      // Fetch species, derivatives, and sizes
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_code FROM species_master WHERE is_active = true LIMIT 50`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_code FROM derivative_master WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const sizes = await queryInterface.sequelize.query(
        `SELECT id, size, size_category FROM size_master WHERE is_active = true`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Create lookup maps
      const speciesMap = {};
      const derivativeMap = {};
      const sizeMap = {};

      species.forEach((s) => {
        const code = s.species_code?.toUpperCase() || "";
        speciesMap[code] = s.id;
      });

      derivatives.forEach((d) => {
        derivativeMap[d.derivative_code] = d.id;
      });

      sizes.forEach((sz) => {
        sizeMap[sz.size_category] = sizeMap[sz.size_category] || [];
        sizeMap[sz.size_category].push({ id: sz.id, size: sz.size });
      });

      console.log(`Loaded ${Object.keys(speciesMap).length} species`);
      console.log(`Loaded ${Object.keys(derivativeMap).length} derivatives`);
      console.log(`Loaded ${Object.keys(sizeMap).length} size categories`);

      // Define the mapping matrix
      const mappings = [];
      let priority = 1;

      // ============================================================================
      // FISH SPECIES
      // ============================================================================

      // ROUND FISH (Salmon, Hilsa, Trout)
      const roundFishDerivatives = [
        "RAW_FILLET",
        "RAW_WINGS",
        "RAW_STEAK",
        "SEMI_MINCED",
      ];
      if (speciesMap["FISH_SALMON"] && roundFishDerivatives[0]) {
        roundFishDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["FISH"]) {
            sizeMap["FISH"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["FISH_SALMON"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // FLAT FISH (Sole, Flounder)
      const flatFishDerivatives = ["RAW_FILLET", "RAW_TRIM", "SEMI_MINCED"];
      if (speciesMap["FISH_SOLE"] && flatFishDerivatives[0]) {
        flatFishDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["FISH"]) {
            sizeMap["FISH"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["FISH_SOLE"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // PELAGIC LARGE (Tuna, Mackerel)
      const pelagicDerivatives = [
        "RAW_LOIN",
        "RAW_BELLY",
        "RAW_STEAK",
        "SEMI_MINCED",
      ];
      if (speciesMap["FISH_TUNA"] && pelagicDerivatives[0]) {
        pelagicDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["FISH"]) {
            sizeMap["FISH"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["FISH_TUNA"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // ============================================================================
      // CRUSTACEAN SPECIES
      // ============================================================================

      // SHRIMP (Tiger Shrimp, Vannamei)
      const shrimpDerivatives = ["RAW_WHOLE_ROUND", "SEMI_PD", "SEMI_PDTO"];
      if (speciesMap["CRUST_SHRIMP"] && shrimpDerivatives[0]) {
        shrimpDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["SHRIMP"]) {
            sizeMap["SHRIMP"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["CRUST_SHRIMP"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} at ${size.size} count/kg`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // CRAB
      const crabDerivatives = ["RAW_WHOLE_ROUND", "RAW_MEAT", "STOCK_BASE"];
      if (speciesMap["CRUST_CRAB"] && crabDerivatives[0]) {
        crabDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["CRUSTACEAN"]) {
            sizeMap["CRUSTACEAN"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["CRUST_CRAB"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} at ${size.size}g per piece`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // LOBSTER
      const lobsterDerivatives = [
        "RAW_TAIL",
        "RAW_TAIL_MEAT",
        "STOCK_BASE",
        "BYPRODUCT_SHELL",
      ];
      if (speciesMap["CRUST_LOBSTER"] && lobsterDerivatives[0]) {
        lobsterDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["CRUSTACEAN"]) {
            sizeMap["CRUSTACEAN"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["CRUST_LOBSTER"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} at ${size.size}g per piece`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // ============================================================================
      // CEPHALOPOD SPECIES
      // ============================================================================

      // SQUID / CUTTLEFISH
      const squidDerivatives = ["RAW_WHOLE_ROUND", "RAW_TUBE", "SEMI_MINCED"];
      if (speciesMap["CEPH_SQUID"] && squidDerivatives[0]) {
        squidDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["CEPHALOPOD"]) {
            sizeMap["CEPHALOPOD"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["CEPH_SQUID"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // OCTOPUS
      const octopusDerivatives = [
        "RAW_WHOLE_ROUND",
        "RAW_CLEANED",
        "COOKED_BOILED",
      ];
      if (speciesMap["CEPH_OCTOPUS"] && octopusDerivatives[0]) {
        octopusDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["CEPHALOPOD"]) {
            sizeMap["CEPHALOPOD"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["CEPH_OCTOPUS"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // ============================================================================
      // BIVALVE SPECIES
      // ============================================================================

      // SCALLOP, OYSTER, CLAM
      const bivalveDerivatives = ["RAW_WHOLE_ROUND", "RAW_MEAT", "SEMI_MINCED"];
      if (speciesMap["BIV_OYSTER"] && bivalveDerivatives[0]) {
        bivalveDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["BIVALVE"]) {
            sizeMap["BIVALVE"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["BIV_OYSTER"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} shell size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // ============================================================================
      // GASTROPOD SPECIES
      // ============================================================================

      // CONCH, ABALONE
      const gastropodDerivatives = [
        "RAW_WHOLE_ROUND",
        "RAW_MEAT",
        "COOKED_BOILED",
      ];
      if (speciesMap["GAST_CONCH"] && gastropodDerivatives[0]) {
        gastropodDerivatives.forEach((deriv) => {
          if (derivativeMap[deriv] && sizeMap["BIVALVE"]) {
            sizeMap["BIVALVE"].forEach((size) => {
              mappings.push({
                id: uuidv4(),
                species_id: speciesMap["GAST_CONCH"],
                derivative_id: derivativeMap[deriv],
                size_id: size.id,
                priority_order: priority++,
                is_applicable: true,
                notes: `${deriv} in ${size.size} shell size`,
                is_active: true,
                created_by: systemUserId,
                updated_by: systemUserId,
                created_at: now,
                updated_at: now,
                deleted_at: null,
              });
            });
          }
        });
      }

      // Insert all mappings
      if (mappings.length > 0) {
        await queryInterface.bulkInsert(
          "species_derivative_size_mapping",
          mappings,
          {}
        );
        console.log(
          `✅ Inserted ${mappings.length} species-derivative-size mappings`
        );
      } else {
        console.log(
          "⚠️ No mappings created - check if species, derivatives, and sizes are properly seeded"
        );
      }

      console.log("\n");
    } catch (error) {
      console.error(
        "❌ Error seeding species-derivative-size mappings:",
        error
      );
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("Removing species-derivative-size mapping seeded data...");

      await queryInterface.sequelize.query(
        `DELETE FROM species_derivative_size_mapping WHERE created_by = '00000000-0000-0000-0000-000000000000'`,
        { type: Sequelize.QueryTypes.DELETE }
      );

      console.log("✅ Removed species-derivative-size mapping seeded data");
    } catch (error) {
      console.error(
        "Error removing species-derivative-size mapping seeded data:",
        error
      );
      throw error;
    }
  },
};
