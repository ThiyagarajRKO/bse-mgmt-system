"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SEEDER: Generate RAW Material Products
 *
 * Creates RAW material products for every species × size combination
 *
 * RAW MATERIAL RULES (ENFORCED):
 * ✔ processing_state = 'RAW'
 * ✔ product_role = 'RAW_MATERIAL'
 * ✔ is_raw = true
 * ✔ is_producible = FALSE (raw materials are inputs, not outputs)
 * ✔ is_sellable = TRUE (can be sold fresh)
 * ✔ No grade (grade_master_id = NULL)
 * ✔ Must have size_id (can be UNSIZED)
 * ✔ No derivative (derivative_master_id = NULL)
 *
 * SKU FORMAT: {SPECIES_CODE}-WHL-RAW-{SIZE_CODE}
 * PRODUCT NAME: {Species Name} – Whole – Raw – {Size Display}
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log("\n🐟 Generating RAW material products...");

      // Check if RAW products already exist
      const existingRaw = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM product_master WHERE processing_state = 'RAW'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingRaw[0].count > 0) {
        console.log(
          `✅ ${existingRaw[0].count} RAW products already exist, skipping...`
        );
        return;
      }

      // Get all active species
      const species = await queryInterface.sequelize.query(
        `
        SELECT id, species_code, species_name, hsn_code
        FROM species_master
        WHERE is_active = true
        ORDER BY species_code
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${species.length} active species`);

      // Get all sizes (including UNSIZED)
      const sizes = await queryInterface.sequelize.query(
        `
        SELECT id, size, unit_of_measure
        FROM size_master
        WHERE is_active = true
        ORDER BY size
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(`Found ${sizes.length} sizes`);

      // Get default product category for RAW products
      const defaultCategory = await queryInterface.sequelize.query(
        `
        SELECT id FROM product_category_master
        WHERE is_active = true
        LIMIT 1
        `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      const categoryId =
        defaultCategory.length > 0 ? defaultCategory[0].id : uuidv4();

      // Get default tax code for RAW products (skip if table doesn't exist)
      let taxCodeId = null;
      try {
        const defaultTaxCode = await queryInterface.sequelize.query(
          `
          SELECT id FROM tax_master
          WHERE is_active = true
          LIMIT 1
          `,
          { type: Sequelize.QueryTypes.SELECT }
        );

        taxCodeId = defaultTaxCode.length > 0 ? defaultTaxCode[0].id : null;
      } catch (e) {
        console.log(
          "   ⚠️  Tax master not available, skipping tax code lookup"
        );
      }

      // Generate RAW products
      const rawProducts = [];
      const now = new Date();
      let systemUserId = "00000000-0000-0000-0000-000000000000";

      const users = await queryInterface.sequelize.query(
        `SELECT id FROM user_profiles LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (users.length > 0) {
        systemUserId = users[0].id;
      }

      let skuCount = 0;

      for (const sp of species) {
        for (const sz of sizes) {
          // Generate RAW SKU
          // Format: {SPECIES_CODE}-WHL-RAW-{SIZE_CODE}
          const sizeCode = sz.size
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/–/g, "_");
          const sku = `${sp.species_code}-WHL-RAW-${sizeCode}`;

          // Generate RAW product name
          // Format: {Species Name} – Whole – Raw – {Size}
          const productName = `${sp.species_name} – Whole – Raw – ${sz.size}`;

          const rawProduct = {
            id: uuidv4(),
            product_name: productName,
            product_category_master_id: categoryId,
            size_master_id: sz.id,
            grade_master_id: null, // RAW cannot have grade
            derivative_master_id: null, // RAW is not a derivative
            species_derivative_size_grade_mapping_id: null, // RAW products don't use 4D mapping
            hsn_code: sp.hsn_code,
            processing_state: "RAW",
            product_role: "RAW_MATERIAL",
            is_raw: true,
            is_producible: false, // RAW is input, not output
            is_sellable: true, // Can be sold fresh
            is_active: true,
            created_by: systemUserId,
            updated_by: systemUserId,
            created_at: now,
            updated_at: now,
          };

          rawProducts.push(rawProduct);
          skuCount++;
        }
      }

      console.log(
        `\n📊 Generated ${rawProducts.length} RAW product definitions`
      );

      if (rawProducts.length === 0) {
        console.log("⚠️  No RAW products to insert");
        return;
      }

      // Batch insert
      const batchSize = 500;
      for (let i = 0; i < rawProducts.length; i += batchSize) {
        const batch = rawProducts.slice(i, i + batchSize);
        await queryInterface.bulkInsert("product_master", batch, {});
        console.log(
          `  ✓ Inserted ${Math.min(i + batchSize, rawProducts.length)}/${
            rawProducts.length
          }`
        );
      }

      console.log(`\n✅ RAW material seeder completed successfully`);
      console.log(`   📦 Total RAW products: ${rawProducts.length}`);
      console.log(
        `   🐟 Species × Sizes coverage: ${species.length} species × ${sizes.length} sizes`
      );
    } catch (error) {
      console.error("❌ Error in RAW product seeder:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log("\n🔄 Removing RAW material products...");

      await queryInterface.sequelize.query(
        `DELETE FROM product_master WHERE processing_state = 'RAW'`
      );

      console.log("✅ RAW products removed");
    } catch (error) {
      console.error("❌ Error removing RAW products:", error.message);
      throw error;
    }
  },
};
