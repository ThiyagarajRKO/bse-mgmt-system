"use strict";

/**
 * Fix BOM Calculation Bug - Recalculate quantity_required values
 *
 * Issue: BOM values were calculated using wrong yield values
 * - Was using RAW product yield (100%)
 * - Should use PROCESSED product yield (e.g., 70% for PRC_DRESSED)
 *
 * Fix: Recalculate all BOM quantity_required values using correct formula
 * quantityRequired = 1 / (processedProductYield / 100)
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    console.log("\n🔧 FIXING BOM Calculation Bug...\n");

    try {
      // Step 1: Get all BOM entries with their associated processed product yields
      console.log("Step 1: Fetching all BOM entries...");
      const bomEntries = await queryInterface.sequelize.query(
        `SELECT 
          bom.id,
          bom.product_master_id,
          bom.quantity_required as old_value,
          sdsm.expected_yield_percent
        FROM bill_of_materials bom
        JOIN product_master pm ON bom.product_master_id = pm.id
        JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
        WHERE bom.is_active = true`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
      );

      console.log(`Found ${bomEntries.length} BOM entries to recalculate\n`);

      // Step 2: Calculate and prepare update data
      console.log("Step 2: Calculating correct quantity_required values...");
      let updatedCount = 0;
      let errorCount = 0;

      for (const bomEntry of bomEntries) {
        try {
          const yieldPercent =
            parseFloat(bomEntry.expected_yield_percent) || 85;

          // Validate yield
          if (!yieldPercent || yieldPercent <= 0 || yieldPercent > 100) {
            console.warn(
              `⚠️  Invalid yield for BOM ${bomEntry.id}: ${yieldPercent}, skipping`,
            );
            errorCount++;
            continue;
          }

          // Calculate correct value
          const newQuantityRequired =
            Math.round((1 / (yieldPercent / 100)) * 100) / 100;

          // Update in database
          await queryInterface.sequelize.query(
            `UPDATE bill_of_materials 
             SET quantity_required = :newValue, updated_at = :now
             WHERE id = :id`,
            {
              replacements: {
                id: bomEntry.id,
                newValue: newQuantityRequired,
                now: now,
              },
            },
          );

          if (newQuantityRequired !== bomEntry.old_value) {
            updatedCount++;
            if (updatedCount <= 5) {
              console.log(
                `  ✓ BOM ${bomEntry.id}: ${bomEntry.old_value} → ${newQuantityRequired} (yield: ${yieldPercent}%)`,
              );
            }
          }
        } catch (err) {
          console.error(`Error updating BOM ${bomEntry.id}:`, err.message);
          errorCount++;
        }
      }

      console.log(
        `\n✅ Fixed ${updatedCount} BOM records with incorrect values`,
      );
      if (errorCount > 0) {
        console.log(`⚠️  ${errorCount} records had errors and were skipped`);
      }

      // Step 3: Verify fixes
      console.log(
        "\nStep 3: Verification - Checking specific PRC_DRESSED calculation...",
      );
      const verification = await queryInterface.sequelize.query(
        `SELECT 
          bom.id,
          pm.product_name,
          sdsm.expected_yield_percent,
          bom.quantity_required,
          (1.0 / (sdsm.expected_yield_percent / 100)) as expected_value
        FROM bill_of_materials bom
        JOIN product_master pm ON bom.product_master_id = pm.id
        JOIN species_derivative_size_grade_mapping sdsm ON pm.species_derivative_size_grade_mapping_id = sdsm.id
        WHERE pm.product_name LIKE '%PRC DRESSED%'
        LIMIT 3`,
        { type: queryInterface.sequelize.QueryTypes.SELECT },
      );

      for (const rec of verification) {
        const match =
          Math.abs(rec.quantity_required - rec.expected_value) < 0.01;
        console.log(
          `  ${match ? "✅" : "❌"} ${rec.product_name}: ${rec.quantity_required} kg/kg (yield: ${rec.expected_yield_percent}%)`,
        );
      }

      console.log("\n✅ BOM Calculation Bug Fix Complete!\n");
      console.log(
        "Next: API should now return correct raw material requirements",
      );
      console.log(
        "Example: 5,000 units × 2kg PRC_DRESSED = 10,000 kg finished",
      );
      console.log("Raw needed: 10,000 × 1.4286 (70% yield) = 14,286 kg\n");
    } catch (error) {
      console.error("❌ Error during BOM fix:", error);
      throw error;
    }
  },

  async down(queryInterface) {
    console.log("⚠️  Rollback not implemented for BOM fix");
    // Note: This migration doesn't have a rollback because we don't know the original incorrect values
    // If rollback is needed, restore from backup
  },
};
