"use strict";

/**
 * SEEDER: Populate GST mappings for remaining unmapped derivatives
 *
 * This seeder adds GST mappings for the 15 derivatives that were not covered
 * in the initial seeding:
 *
 * CATEGORY 1: Cuts/Sections (Finfish) → HSN 0304
 *   - Headed, Headless, Loin, Steaks/Slices, Portion
 *
 * CATEGORY 2: Cephalopod Parts → HSN 0304
 *   - Rings, Tentacles, Tubes
 *
 * CATEGORY 3: Crustacean Parts → HSN 0306
 *   - Tails, Peeled variants (PD/PTO/PDTO/PUD)
 *
 * CATEGORY 4: Whole Products (RAW) → HSN 0303/0306
 *   - Whole (Head-on Shell-on), Whole (In Shell), Whole (Round/As Received)
 *
 * Strategy: Apply these mappings to all species where applicable
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting remaining derivative GST mapping seeding...");

    try {
      // ============================================================================
      // PHASE 1: Fetch required data
      // ============================================================================

      // Get all species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name FROM species_master WHERE is_active = true ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get all derivatives (including unmapped ones)
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_name FROM derivative_master WHERE is_active = true ORDER BY derivative_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get GST masters
      const gstMasters = await queryInterface.sequelize.query(
        `SELECT id, hsn_code FROM consolidated_gst_master WHERE is_active = true ORDER BY hsn_code`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(
        `✓ Found ${species.length} species, ${derivatives.length} derivatives, ${gstMasters.length} GST masters`,
      );

      // Create lookup maps
      const derivativeMap = {};
      derivatives.forEach((d) => {
        derivativeMap[d.derivative_name.toLowerCase()] = d.id;
      });

      const gstMap = {};
      gstMasters.forEach((g) => {
        if (!gstMap[g.hsn_code]) {
          gstMap[g.hsn_code] = g.id;
        }
      });

      // ============================================================================
      // PHASE 2: Define missing derivative GST mappings
      // ============================================================================

      // Mapping config: [derivative_name, processing_state, hsn_code_primary, hsn_code_crustacean]
      const missingDerivatives = [
        // Finfish cuts/sections → HSN 0304
        ["Headed", "PROCESSED", "0304", null],
        ["Headless", "PROCESSED", "0304", null],
        ["Loin", "PROCESSED", "0304", null],
        ["Steaks / Slices", "PROCESSED", "0304", null],
        ["Portion", "PROCESSED", "0304", null],

        // Cephalopod parts → HSN 0304
        ["Rings (Squid/Cuttlefish)", "PROCESSED", "0304", null],
        ["Tentacles (Squid/Octopus)", "PROCESSED", "0304", null],
        ["Tubes (Squid/Cuttlefish)", "PROCESSED", "0304", null],

        // Crustacean parts → HSN 0306
        ["Tails (Shrimp/Lobster)", "PROCESSED", null, "0306"],
        ["Peeled Deveined (PD)", "PROCESSED", null, "0306"],
        ["Peeled Tail-on (PTO / PDTO)", "PROCESSED", null, "0306"],
        ["Peeled Undeveined (PUD)", "PROCESSED", null, "0306"],

        // Whole products (RAW) - use species default
        ["Whole (Head-on Shell-on)", "RAW", "0303", "0306"],
        ["Whole (In Shell)", "RAW", "0303", "0306"],
        ["Whole (Round / As Received)", "RAW", "0303", "0306"],
      ];

      // ============================================================================
      // PHASE 3: Generate mappings for all species
      // ============================================================================

      const mappingsToInsert = [];
      let insertedCount = 0;
      let skippedCount = 0;

      for (const [
        derivativeName,
        processingState,
        hsnFinfish,
        hsnCrustacean,
      ] of missingDerivatives) {
        const derivativeId = derivativeMap[derivativeName.toLowerCase()];

        if (!derivativeId) {
          console.warn(`⚠ Derivative not found: ${derivativeName}`);
          skippedCount++;
          continue;
        }

        // For each species, create mapping
        for (const sp of species) {
          // Determine HSN based on species category
          let hsn = hsnFinfish; // default

          // For crustacean-specific derivatives, use crustacean HSN
          if (
            (hsnCrustacean &&
              sp.species_name.toLowerCase().includes("shrimp")) ||
            sp.species_name.toLowerCase().includes("prawn") ||
            sp.species_name.toLowerCase().includes("lobster") ||
            sp.species_name.toLowerCase().includes("crab") ||
            sp.species_name.toLowerCase().includes("crayfish")
          ) {
            hsn = hsnCrustacean;
          }

          // For bivalve/mollusc species with whole products, use 0306/0307
          if (processingState === "RAW" && hsnFinfish === "0303") {
            if (
              sp.species_name.toLowerCase().includes("oyster") ||
              sp.species_name.toLowerCase().includes("scallop") ||
              sp.species_name.toLowerCase().includes("clam") ||
              sp.species_name.toLowerCase().includes("mussel") ||
              sp.species_name.toLowerCase().includes("squid") ||
              sp.species_name.toLowerCase().includes("octopus") ||
              sp.species_name.toLowerCase().includes("cuttlefish")
            ) {
              hsn = "0306"; // or 0307 for molluscs - using 0306 as standard
            }
          }

          const gstId = gstMap[hsn];
          if (!gstId) {
            console.warn(`⚠ GST master not found for HSN: ${hsn}`);
            skippedCount++;
            continue;
          }

          // Check if mapping already exists
          const existing = await queryInterface.sequelize.query(
            `SELECT id FROM derivative_gst_mapping 
             WHERE species_master_id = :speciesId 
             AND derivative_master_id = :derivativeId 
             AND processing_state = :processingState`,
            {
              replacements: {
                speciesId: sp.id,
                derivativeId: derivativeId,
                processingState: processingState,
              },
              type: Sequelize.QueryTypes.SELECT,
            },
          );

          if (existing.length > 0) {
            // Already has a mapping, skip
            continue;
          }

          mappingsToInsert.push({
            id: Sequelize.literal("gen_random_uuid()"),
            species_master_id: sp.id,
            derivative_master_id: derivativeId,
            processing_state: processingState,
            gst_master_id: gstId,
            is_active: true,
            created_at: now,
            updated_at: now,
          });

          insertedCount++;
        }
      }

      // ============================================================================
      // PHASE 4: Bulk insert
      // ============================================================================

      if (mappingsToInsert.length > 0) {
        await queryInterface.bulkInsert(
          "derivative_gst_mapping",
          mappingsToInsert,
          { ignoreDuplicates: true },
        );
        console.log(
          `✅ Inserted ${mappingsToInsert.length} derivative GST mappings`,
        );
      }

      console.log(
        `✅ Completed: ${mappingsToInsert.length} inserted, ${skippedCount} skipped`,
      );
    } catch (err) {
      console.error("❌ Error during seeding:", err.message);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("Rolling back remaining derivative GST mappings...");
    // Note: This seeder doesn't remove mappings on rollback to avoid data loss
    console.log("✅ Rollback complete (no data removed for safety)");
  },
};
