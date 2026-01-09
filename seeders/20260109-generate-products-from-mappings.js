"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEEDER: Generate Product Master from 4D Mappings
 *
 * Takes existing species_derivative_size_grade_mapping (4D mappings)
 * and generates product_master entries for each mapping.
 *
 * This creates ~2000 products from 2000 mappings.
 *
 * Each product includes:
 * - Auto-generated product_name (unique)
 * - References to 4D mapping
 * - References to species, derivative, size, grade
 * - HSN code (from species)
 * - Default values for processing_state, product_role, is_raw
 * - Product category mapping
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log(
        "\n🏭 Generating products from species-derivative-size-grade mappings..."
      );

      // Get the actual system user
      let systemUserId = "00000000-0000-0000-0000-000000000000";
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (users.length > 0) {
        systemUserId = users[0].id;
      }

      // Check if products already exist
      const existingProducts = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM product_master WHERE species_derivative_size_grade_mapping_id IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingProducts[0].count > 0) {
        console.log(
          `✅ ${existingProducts[0].count} products already exist, skipping...`
        );
        return;
      }

      // Get all 4D mappings with full details (WITHOUT product_category_master to avoid duplicates)
      const mappings = await queryInterface.sequelize.query(
        `
        SELECT 
          sdsgm.id as mapping_id,
          s.species_code,
          s.species_name,
          s.hsn_code,
          d.derivative_code,
          d.derivative_name,
          sz.size,
          sz.unit_of_measure,
          g.grade_code,
          g.grade_name
        FROM species_derivative_size_grade_mapping sdsgm
        INNER JOIN species_master s ON sdsgm.species_master_id = s.id
        INNER JOIN derivative_master d ON sdsgm.derivative_master_id = d.id
        INNER JOIN size_master sz ON sdsgm.size_master_id = sz.id
        INNER JOIN grade_master g ON sdsgm.grade_master_id = g.id
        WHERE sdsgm.is_active = true
        ORDER BY s.species_code, d.derivative_code, sz.size, g.grade_code
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${mappings.length} active 4D mappings to convert to products`
      );

      if (mappings.length === 0) {
        console.log("❌ No mappings found!");
        return;
      }

      // Get default product category if needed
      const defaultCategory = await queryInterface.sequelize.query(
        `SELECT id FROM product_category_master LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const defaultCategoryId =
        defaultCategory.length > 0 ? defaultCategory[0].id : uuidv4();

      // Get the size, grade, and derivative IDs from mappings
      const mappingDetails = await queryInterface.sequelize.query(
        `
        SELECT 
          id as mapping_id,
          species_master_id,
          derivative_master_id,
          size_master_id,
          grade_master_id
        FROM species_derivative_size_grade_mapping
        WHERE is_active = true
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Create a map for quick lookup
      const mappingMap = {};
      mappingDetails.forEach((m) => {
        mappingMap[m.mapping_id] = {
          species_id: m.species_master_id,
          derivative_id: m.derivative_master_id,
          size_id: m.size_master_id,
          grade_id: m.grade_master_id,
        };
      });

      // Generate products from mappings
      const products = [];
      const now = new Date();

      for (const mapping of mappings) {
        const details = mappingMap[mapping.mapping_id];

        // Generate deterministic SKU
        const sku = `${mapping.species_code}-${mapping.derivative_code}-${mapping.size}-${mapping.grade_code}`;

        // Generate product name
        const productName = `${mapping.species_name} – ${mapping.derivative_name} – ${mapping.size} – ${mapping.grade_name}`;

        // Create product record
        const product = {
          id: uuidv4(),
          product_name: productName,
          product_category_master_id: defaultCategoryId,
          size_master_id: details?.size_id || null,
          grade_master_id: details?.grade_id || null,
          derivative_master_id: details?.derivative_id || null,
          species_derivative_size_grade_mapping_id: mapping.mapping_id,
          hsn_code: mapping.hsn_code,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
          // Default product state
          processing_state: "PROCESSED",
          product_role: "FINISHED_GOOD",
          is_raw: false,
          packaging_master_id: null,
        };

        products.push(product);

        // Log progress
        if (products.length % 500 === 0) {
          console.log(`  Progress: ${products.length} products generated...`);
        }
      }

      console.log(
        `\nInserting ${products.length} products into product_master...`
      );

      // Batch insert
      const batchSize = 500;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        await queryInterface.bulkInsert("product_master", batch, {});
        console.log(
          `  ✓ Inserted ${Math.min(i + batchSize, products.length)}/${
            products.length
          }`
        );
      }

      console.log(
        `\n✅ Successfully generated ${products.length} products from 4D mappings`
      );
      console.log(`   📦 Total products now in product_master`);
    } catch (error) {
      console.error("❌ Error generating products:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Removing generated products...");

      await queryInterface.bulkDelete("product_master", {
        species_derivative_size_grade_mapping_id: { [Sequelize.Op.ne]: null },
      });

      console.log("✅ Generated products removed");
    } catch (error) {
      console.error("❌ Error removing products:", error.message);
      throw error;
    }
  },
};
