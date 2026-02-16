"use strict";

/**
 * COMPREHENSIVE DERIVATIVE GST MAPPING SEEDER
 *
 * Seeds mappings for ALL species and ALL derivatives
 * - RAW mappings: All species get their species-level HSN
 * - PROCESSED mappings: All species × all derivatives get appropriate HSN based on derivative type
 *
 * Derivative Categorization:
 * - Fillets/Cleaned (0304): Fillet, Gilled & Gutted, Gutted, Dressed, Half-Shell, Shucked, etc.
 * - Cooked/Canned (1605): Cooked Fish, Cooked Shrimp, Canned, Marinated, etc.
 * - Value-Added/Breaded (1605): Breaded, Frozen Prepared, EZ Peel, etc.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log(
      "\n🔄 Starting comprehensive derivative GST mapping seeding...",
    );

    try {
      // ============================================================================
      // PHASE 1: Fetch all required data
      // ============================================================================

      // Get all active species with their HSN codes
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name, hsn_code FROM species_master 
         WHERE is_active = true ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get all active derivatives
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_name FROM derivative_master 
         WHERE is_active = true ORDER BY derivative_name`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      // Get all GST masters indexed by HSN
      const gstMasters = await queryInterface.sequelize.query(
        `SELECT id, hsn_code, gst_name FROM consolidated_gst_master 
         WHERE is_active = true ORDER BY hsn_code`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log(`\n✓ Found ${species.length} species`);
      console.log(`✓ Found ${derivatives.length} derivatives`);
      console.log(`✓ Found ${gstMasters.length} GST masters\n`);

      // Create lookup maps
      const gstMap = {};
      gstMasters.forEach((g) => {
        if (!gstMap[g.hsn_code]) {
          gstMap[g.hsn_code] = { id: g.id, name: g.gst_name };
        }
      });

      // Check what HSN codes are available
      const availableHSN = Object.keys(gstMap);
      console.log(`Available HSN codes: ${availableHSN.join(", ")}\n`);

      // ============================================================================
      // PHASE 2: Categorize derivatives by processing type
      // ============================================================================

      const derivativeCategories = {
        RAW_WHOLE: [], // No derivative - use species HSN
        FILLETS_CLEANED: [], // 0304 - Fish fillets, cleaned whole, gutted, etc.
        COOKED_PREPARED: [], // 1605 - Cooked, canned, marinated, RTE
        VALUE_ADDED: [], // 1605 - Breaded, frozen prepared, etc.
      };

      derivatives.forEach((d) => {
        const name = d.derivative_name.toLowerCase();

        if (
          name.includes("fillet") ||
          name.includes("gutted") ||
          name.includes("cleaned") ||
          name.includes("dressed") ||
          name.includes("shucked") ||
          name.includes("half-shell") ||
          name.includes("claws") ||
          name.includes("knuckles") ||
          name.includes("merus")
        ) {
          derivativeCategories.FILLETS_CLEANED.push(d);
        } else if (
          name.includes("cooked") ||
          name.includes("canned") ||
          name.includes("marinated") ||
          name.includes("ready-to-eat") ||
          name.includes("smoked") ||
          name.includes("steamed") ||
          name.includes("grilled") ||
          name.includes("retort") ||
          name.includes("boiled")
        ) {
          derivativeCategories.COOKED_PREPARED.push(d);
        } else if (
          name.includes("breaded") ||
          name.includes("battered") ||
          name.includes("fried") ||
          name.includes("frozen prepared") ||
          name.includes("ez peel") ||
          name.includes("value-added")
        ) {
          derivativeCategories.VALUE_ADDED.push(d);
        }
      });

      console.log(`Derivative categories identified:`);
      console.log(
        `  Fillets/Cleaned: ${derivativeCategories.FILLETS_CLEANED.length}`,
      );
      console.log(
        `  Cooked/Prepared: ${derivativeCategories.COOKED_PREPARED.length}`,
      );
      console.log(
        `  Value-Added/Breaded: ${derivativeCategories.VALUE_ADDED.length}\n`,
      );

      // ============================================================================
      // PHASE 3: Generate mappings
      // ============================================================================

      const mappingsToInsert = [];
      let skippedCount = 0;

      // Mapping strategy:
      // - RAW (no derivative): Use species HSN
      // - Fillets/Cleaned: HSN 0304 (if exists), else species HSN
      // - Cooked/Prepared: HSN 1605 (if exists), else HSN 0305 or species HSN
      // - Value-Added/Breaded: HSN 1605 (if exists), else HSN 0304

      // Helper to generate UUID v4
      const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      };

      for (const sp of species) {
        // RAW mapping (no derivative)
        if (sp.hsn_code && gstMap[sp.hsn_code]) {
          mappingsToInsert.push({
            id: generateUUID(),
            species_master_id: sp.id,
            derivative_master_id: null,
            processing_state: "RAW",
            gst_master_id: gstMap[sp.hsn_code].id,
            is_active: true,
            created_at: now,
            updated_at: now,
            created_by: systemUserId,
          });
        }

        // PROCESSED mappings
        // Fillets/Cleaned → HSN 0304
        for (const deriv of derivativeCategories.FILLETS_CLEANED) {
          const targetHSN = availableHSN.includes("0304")
            ? "0304"
            : sp.hsn_code;
          if (targetHSN && gstMap[targetHSN]) {
            mappingsToInsert.push({
              id: generateUUID(),
              species_master_id: sp.id,
              derivative_master_id: deriv.id,
              processing_state: "PROCESSED",
              gst_master_id: gstMap[targetHSN].id,
              is_active: true,
              created_at: now,
              updated_at: now,
              created_by: systemUserId,
            });
          } else {
            skippedCount++;
          }
        }

        // Cooked/Prepared → HSN 1605 (or fallback)
        for (const deriv of derivativeCategories.COOKED_PREPARED) {
          const targetHSN = availableHSN.includes("1605")
            ? "1605"
            : availableHSN.includes("0305")
              ? "0305"
              : sp.hsn_code;
          if (targetHSN && gstMap[targetHSN]) {
            mappingsToInsert.push({
              id: generateUUID(),
              species_master_id: sp.id,
              derivative_master_id: deriv.id,
              processing_state: "PROCESSED",
              gst_master_id: gstMap[targetHSN].id,
              is_active: true,
              created_at: now,
              updated_at: now,
              created_by: systemUserId,
            });
          } else {
            skippedCount++;
          }
        }

        // Value-Added/Breaded → HSN 1605 (or fallback to 0304)
        for (const deriv of derivativeCategories.VALUE_ADDED) {
          const targetHSN = availableHSN.includes("1605")
            ? "1605"
            : availableHSN.includes("0304")
              ? "0304"
              : sp.hsn_code;
          if (targetHSN && gstMap[targetHSN]) {
            mappingsToInsert.push({
              id: generateUUID(),
              species_master_id: sp.id,
              derivative_master_id: deriv.id,
              processing_state: "PROCESSED",
              gst_master_id: gstMap[targetHSN].id,
              is_active: true,
              created_at: now,
              updated_at: now,
              created_by: systemUserId,
            });
          } else {
            skippedCount++;
          }
        }
      }

      console.log(`\n📝 Generated ${mappingsToInsert.length} mappings`);
      console.log(`⚠️  Skipped ${skippedCount} due to missing GST masters\n`);

      // ============================================================================
      // PHASE 4: Bulk insert (skip existing)
      // ============================================================================

      // Get existing mappings to avoid duplicates
      const existing = await queryInterface.sequelize.query(
        `SELECT species_master_id, derivative_master_id, processing_state 
         FROM derivative_gst_mapping`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const existingSet = new Set(
        existing.map(
          (e) =>
            `${e.species_master_id}|${e.derivative_master_id || "null"}|${e.processing_state}`,
        ),
      );

      const newMappings = mappingsToInsert.filter((m) => {
        const key = `${m.species_master_id}|${m.derivative_master_id || "null"}|${m.processing_state}`;
        return !existingSet.has(key);
      });

      console.log(`ℹ️  ${existing.length} mappings already exist`);
      console.log(`➕ Inserting ${newMappings.length} new mappings\n`);

      if (newMappings.length > 0) {
        await queryInterface.bulkInsert("derivative_gst_mapping", newMappings);
        console.log(
          `✅ Inserted ${newMappings.length} derivative GST mappings`,
        );
      }

      console.log("\n✅ Comprehensive seeding complete!\n");
    } catch (error) {
      console.error("❌ Error during seeding:", error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // In production, don't delete data on rollback
    console.log("⚠️  Skipping data deletion on rollback");
  },
};
