"use strict";

/**
 * DERIVATIVE GST MAPPING SEEDER
 *
 * Seeds derivative-specific GST and HSN code mappings
 * Maps: Species + Derivative + Processing State → GST Master (with HSN code)
 *
 * Examples:
 * - Albacore Tuna (RAW, Whole) → HSN 0303, 5% GST
 * - Albacore Tuna (PROCESSED, Fillet) → HSN 0304, 5% GST
 * - Albacore Tuna (PROCESSED, Cooked) → HSN 1604, 12% GST
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting derivative GST mapping seeding...");

    try {
      // ============================================================================
      // PHASE 1: Fetch required IDs (Species, Derivatives, GST Masters)
      // ============================================================================

      // Get species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name FROM species_master WHERE is_active = true ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get derivatives
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_name FROM derivative_master WHERE is_active = true ORDER BY derivative_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get GST masters by HSN code (for easy reference)
      const gstMasters = await queryInterface.sequelize.query(
        `SELECT id, hsn_code, gst_name FROM consolidated_gst_master WHERE is_active = true ORDER BY hsn_code`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(
        `✓ Found ${species.length} species, ${derivatives.length} derivatives, ${gstMasters.length} GST masters`,
      );

      // Create maps for quick lookup
      const speciesMap = {};
      species.forEach((s) => {
        speciesMap[s.species_name.toLowerCase()] = s.id;
      });

      const derivativeMap = {};
      derivatives.forEach((d) => {
        derivativeMap[d.derivative_name.toLowerCase()] = d.id;
      });

      const gstMap = {};
      gstMasters.forEach((g) => {
        if (!gstMap[g.hsn_code]) {
          gstMap[g.hsn_code] = [];
        }
        gstMap[g.hsn_code].push({ id: g.id, name: g.gst_name });
      });

      // ============================================================================
      // PHASE 2: Define derivative GST mappings
      // ============================================================================

      const mappings = [
        // RAW SEAFOOD - HSN 0303 (Frozen fish non-fillet) - 5% GST
        {
          species: "Albacore Tuna",
          derivative: null,
          processing_state: "RAW",
          hsn: "0303",
          description: "Raw whole frozen tuna",
        },
        {
          species: "Bay Scallop",
          derivative: null,
          processing_state: "RAW",
          hsn: "0303",
          description: "Raw frozen scallops",
        },
        {
          species: "Eastern Oyster",
          derivative: null,
          processing_state: "RAW",
          hsn: "0306",
          description: "Raw frozen oysters (crustaceans/mollusks)",
        },
        {
          species: "Dungeness Crab",
          derivative: null,
          processing_state: "RAW",
          hsn: "0306",
          description: "Raw frozen crab",
        },

        // PROCESSED (Fillets/Whole Cleaned) - HSN 0304 - 5% GST
        {
          species: "Albacore Tuna",
          derivative: "Fillet (Skin-on)",
          processing_state: "PROCESSED",
          hsn: "0304",
          description: "Processed tuna fillets (skin-on)",
        },
        {
          species: "Albacore Tuna",
          derivative: "Fillet (Skinless)",
          processing_state: "PROCESSED",
          hsn: "0304",
          description: "Processed tuna fillets (skinless)",
        },
        {
          species: "Albacore Tuna",
          derivative: "Gilled & Gutted (GG)",
          processing_state: "PROCESSED",
          hsn: "0304",
          description: "Processed whole cleaned tuna",
        },
        {
          species: "Bay Scallop",
          derivative: "Shucked Meat (Bivalves)",
          processing_state: "PROCESSED",
          hsn: "0304",
          description: "Processed scallop meat",
        },

        // PROCESSED (Cooked) - HSN 1605 (Prepared/Preserved) - 12% GST
        {
          species: "Albacore Tuna",
          derivative: "Cooked Fish (Steamed/Grilled/Smoked)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed cooked tuna",
        },
        {
          species: "Albacore Tuna",
          derivative: "Canned / Retort Seafood (Shelf-stable)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed canned tuna",
        },
        {
          species: "Bay Scallop",
          derivative: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed cooked scallops",
        },
        {
          species: "Eastern Oyster",
          derivative: "Cooked Bivalve Meat (Mussel/Oyster/Clam)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed cooked oysters",
        },

        // PROCESSED (Value-Added/Breaded) - HSN 1605 - 12% GST
        {
          species: "Albacore Tuna",
          derivative: "Breaded / Battered Seafood (Value-added)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed breaded tuna",
        },
        {
          species: "Bay Scallop",
          derivative: "Breaded / Battered Seafood (Value-added)",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Processed breaded scallops",
        },
        {
          species: "Bay Scallop",
          derivative: "Marinated / Ready-to-Eat Seafood",
          processing_state: "PROCESSED",
          hsn: "1605",
          description: "Marinated ready-to-eat scallops",
        },
      ];

      // ============================================================================
      // PHASE 3: Insert mappings
      // ============================================================================

      const mappingsToInsert = [];
      let skippedCount = 0;

      for (const mapping of mappings) {
        const speciesId = speciesMap[mapping.species.toLowerCase()];
        const derivativeId = mapping.derivative
          ? derivativeMap[mapping.derivative.toLowerCase()]
          : null;
        const gstOptions = gstMap[mapping.hsn];

        if (!speciesId) {
          console.warn(`⚠ Species not found: ${mapping.species}`);
          skippedCount++;
          continue;
        }

        if (mapping.derivative && !derivativeId) {
          console.warn(`⚠ Derivative not found: ${mapping.derivative}`);
          skippedCount++;
          continue;
        }

        if (!gstOptions || gstOptions.length === 0) {
          console.warn(`⚠ GST master not found for HSN: ${mapping.hsn}`);
          skippedCount++;
          continue;
        }

        // Use the first GST master with this HSN (should be the primary one)
        const gstMasterId = gstOptions[0].id;

        mappingsToInsert.push({
          id: Sequelize.literal("gen_random_uuid()"),
          species_master_id: speciesId,
          derivative_master_id: derivativeId,
          processing_state: mapping.processing_state,
          gst_master_id: gstMasterId,
          hsn_code_override: null, // Use HSN from GST master
          effective_from: now,
          effective_to: null,
          is_active: true,
          created_by: systemUserId,
          updated_by: null,
          deleted_by: null,
          created_at: now,
          updated_at: null,
          deleted_at: null,
        });

        console.log(
          `✓ Mapping: ${mapping.species}${
            mapping.derivative ? ` > ${mapping.derivative}` : " (RAW)"
          } → HSN ${mapping.hsn}`,
        );
      }

      // Insert all mappings
      if (mappingsToInsert.length > 0) {
        await queryInterface.bulkInsert(
          "derivative_gst_mapping",
          mappingsToInsert,
        );
        console.log(
          `\n✅ Inserted ${mappingsToInsert.length} derivative GST mappings`,
        );
      }

      if (skippedCount > 0) {
        console.warn(
          `⚠ Skipped ${skippedCount} mappings due to missing references`,
        );
      }
    } catch (err) {
      console.error(
        "❌ Error during derivative GST mapping seeding:",
        err.message,
      );
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back derivative GST mappings...");
    try {
      // Remove all seeded mappings (or specific subset based on created_by)
      await queryInterface.bulkDelete("derivative_gst_mapping", {
        created_by: "00000000-0000-0000-0000-000000000000",
      });
      console.log("✅ Rolled back derivative GST mappings");
    } catch (err) {
      console.error("Error rolling back:", err.message);
      throw err;
    }
  },
};
