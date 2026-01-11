"use strict";

/**
 * Migration: Populate Bill of Materials for all species
 *
 * Creates BOMs for all 5 species types (Fish, Crustacean, Cephalopod, Bivalve, Gastropod)
 * Maps raw materials to BOM inputs
 * Sets up derivative outputs with appropriate yield percentages
 * Configures grade/size yield multipliers
 */

const { v4: uuidv4 } = require("uuid");

// Import BOM generator utilities
const bomGenerator = require("../scripts/bom-generator");

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("🚀 Starting BOM population for all species...\n");

      // Step 1: Get all active species
      const species = await queryInterface.sequelize.query(
        `SELECT id, species_name, species_code 
         FROM species_master 
         WHERE is_active = true AND deleted_at IS NULL
         ORDER BY species_name`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${species.length} active species\n`);

      // Step 2: Get all active products with their categories and species
      const products = await queryInterface.sequelize.query(
        `SELECT pm.id, pm.product_name, pm.is_active,
                pcm.product_category, pcm.species_master_id as species_id,
                sm.species_name, sm.species_code
         FROM product_master pm
         JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
         JOIN species_master sm ON pcm.species_master_id = sm.id
         WHERE pm.is_active = true AND pm.deleted_at IS NULL
         ORDER BY sm.species_name, pcm.product_category`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${products.length} active products\n`);

      // Step 3: Get all derivatives
      const derivatives = await queryInterface.sequelize.query(
        `SELECT id, derivative_code, derivative_name
         FROM derivative_master
         WHERE is_active = true
         ORDER BY derivative_code`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`✓ Found ${derivatives.length} derivative types\n`);

      // Step 4: Generate BOM data for all species
      console.log("📊 Generating BOM structure...\n");
      const bomData = bomGenerator.generateBomSQL(
        species,
        products,
        derivatives
      );

      console.log(
        `Generated:\n` +
          `  • ${bomData.bom_master.length} BOM master records\n` +
          `  • ${bomData.bom_input.length} raw material mappings\n` +
          `  • ${bomData.bom_output.length} derivative outputs\n` +
          `  • ${bomData.derivative_grade_size_rule.length} grade/size rules\n`
      );

      // Step 5: Insert BOM master records
      console.log("\n📝 Inserting BOM master records...");
      for (const bom of bomData.bom_master) {
        await queryInterface.sequelize.query(
          `INSERT INTO bom_master (id, species_id, bom_code, bom_name, input_uom, output_uom, is_active, created_at, updated_at) 
           VALUES (:id, :species_id, :bom_code, :bom_name, :input_uom, :output_uom, :is_active, NOW(), NOW())`,
          {
            replacements: bom,
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
      console.log(`✓ Inserted ${bomData.bom_master.length} BOM records`);

      // Step 6: Insert BOM inputs (raw materials)
      console.log("📝 Inserting raw material mappings...");
      for (const input of bomData.bom_input) {
        await queryInterface.sequelize.query(
          `INSERT INTO bom_input (id, bom_id, raw_product_id, quantity, uom, created_at, updated_at)
           VALUES (:id, :bom_id, :raw_product_id, :quantity, :uom, NOW(), NOW())`,
          {
            replacements: input,
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
      console.log(
        `✓ Inserted ${bomData.bom_input.length} raw material mappings`
      );

      // Step 7: Insert BOM outputs (derivatives with yields)
      console.log("📝 Inserting derivative outputs with yields...");
      for (const output of bomData.bom_output) {
        await queryInterface.sequelize.query(
          `INSERT INTO bom_output (id, bom_id, derivative_code, product_id, base_yield_percent, loss_type, created_at, updated_at)
           VALUES (:id, :bom_id, :derivative_code, :product_id, :base_yield_percent, :loss_type, NOW(), NOW())`,
          {
            replacements: output,
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
      console.log(`✓ Inserted ${bomData.bom_output.length} derivative outputs`);

      // Step 8: Insert grade/size rules
      console.log("📝 Inserting grade/size yield rules...");
      for (const rule of bomData.derivative_grade_size_rule) {
        await queryInterface.sequelize.query(
          `INSERT INTO derivative_grade_size_rule (id, species_id, derivative_code, size_min_grams, size_max_grams, allowed_grades, yield_multiplier, created_at, updated_at)
           VALUES (:id, :species_id, :derivative_code, :size_min_grams, :size_max_grams, :allowed_grades, :yield_multiplier, NOW(), NOW())`,
          {
            replacements: rule,
            type: Sequelize.QueryTypes.INSERT,
          }
        );
      }
      console.log(
        `✓ Inserted ${bomData.derivative_grade_size_rule.length} grade/size rules`
      );

      // Step 9: Summary
      console.log("\n✅ BOM population complete!\n");
      console.log("Summary:");
      species.forEach((sp) => {
        const bomCount = bomData.bom_master.filter(
          (b) => b.species_id === sp.id
        ).length;
        const outputCount = bomData.bom_output.filter((o) => {
          const bom = bomData.bom_master.find((b) => b.id === o.bom_id);
          return bom && bom.species_id === sp.id;
        }).length;
        console.log(
          `  • ${sp.species_name}: 1 BOM with ${outputCount} derivatives`
        );
      });

      console.log("\n✓ All BOMs created and linked to products");
      console.log("✓ Grade/size yield multipliers configured");
      console.log("✓ Inventory lookup will now work for all species via BOM");
    } catch (error) {
      console.error("❌ Error populating BOMs:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("↩️  Rolling back BOM population...");

      // Delete in reverse order of dependencies
      await queryInterface.sequelize.query(
        `DELETE FROM derivative_grade_size_rule WHERE id IN (
          SELECT dgsr.id FROM derivative_grade_size_rule dgsr
          JOIN bom_master bm ON dgsr.species_id = bm.species_id
        )`,
        { type: Sequelize.QueryTypes.DELETE }
      );

      await queryInterface.sequelize.query(`DELETE FROM bom_output`, {
        type: Sequelize.QueryTypes.DELETE,
      });

      await queryInterface.sequelize.query(`DELETE FROM bom_input`, {
        type: Sequelize.QueryTypes.DELETE,
      });

      await queryInterface.sequelize.query(`DELETE FROM bom_master`, {
        type: Sequelize.QueryTypes.DELETE,
      });

      console.log("✓ BOM data rolled back successfully");
    } catch (error) {
      console.error("❌ Error rolling back BOMs:", error);
      throw error;
    }
  },
};
