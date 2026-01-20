"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * Populate Product Master from Species-Derivative-Size-Grade Mapping
 *
 * Creates product master records for all valid combinations:
 * - Product name: {Species} {Derivative} {Size} {Grade}
 * - Links to species_derivative_size_grade_mapping for validation
 * - Sets is_raw, is_sellable, is_producible flags
 * - Links to packaging and category masters
 *
 * Generates approximately 5,000-10,000 products depending on:
 * - Number of species × allowed derivatives × sizes × grades
 */

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    console.log("\n📦 Populating product_master from mapping...\n");

    // Fetch PROCESSED products: full detail (species + derivative + size + grade)
    const processedMappings = await queryInterface.sequelize.query(
      `SELECT 
        sdsm.id as mapping_id,
        sdsm.species_master_id,
        sdsm.derivative_master_id,
        sdsm.size_master_id,
        sdsm.grade_master_id,
        s.species_code,
        s.species_name,
        d.derivative_code,
        sz.size,
        g.grade_code,
        sdsm.market_segment,
        sdsm.pricing_tier,
        sdsm.expected_yield_percent,
        sdsm.is_viable,
        d.processing_type
      FROM species_derivative_size_grade_mapping sdsm
      JOIN species_master s ON sdsm.species_master_id = s.id
      JOIN derivative_master d ON sdsm.derivative_master_id = d.id
      JOIN size_master sz ON sdsm.size_master_id = sz.id
      JOIN grade_master g ON sdsm.grade_master_id = g.id
      WHERE sdsm.is_viable = true AND sdsm.is_active = true
        AND d.processing_type != 'UNPROCESSED'
        AND NOT (d.processing_type != 'UNPROCESSED' AND sz.size = 'UNSIZED')
      ORDER BY s.species_code, d.derivative_code, sz.size, g.grade_code`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    // Fetch RAW products: DISTINCT species + derivative only (no size/grade duplication)
    const rawMappings = await queryInterface.sequelize.query(
      `SELECT DISTINCT ON (s.species_name, d.derivative_code)
        sdsm.id as mapping_id,
        sdsm.species_master_id,
        sdsm.derivative_master_id,
        sdsm.size_master_id,
        sdsm.grade_master_id,
        s.species_code,
        s.species_name,
        d.derivative_code,
        sz.size,
        g.grade_code,
        sdsm.market_segment,
        sdsm.pricing_tier,
        sdsm.expected_yield_percent,
        sdsm.is_viable,
        d.processing_type
      FROM species_derivative_size_grade_mapping sdsm
      JOIN species_master s ON sdsm.species_master_id = s.id
      JOIN derivative_master d ON sdsm.derivative_master_id = d.id
      JOIN size_master sz ON sdsm.size_master_id = sz.id
      JOIN grade_master g ON sdsm.grade_master_id = g.id
      WHERE sdsm.is_viable = true AND sdsm.is_active = true
        AND d.processing_type = 'UNPROCESSED'
      ORDER BY s.species_name, d.derivative_code`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const mappings = [...rawMappings, ...processedMappings];

    console.log(
      `Found ${rawMappings.length} RAW mappings (distinct species+derivative)`,
    );
    console.log(`Found ${processedMappings.length} PROCESSED mappings\n`);

    // Fetch supporting data
    const categories = await queryInterface.sequelize.query(
      `SELECT id, product_category FROM product_category_master WHERE is_active = true LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const packaging = await queryInterface.sequelize.query(
      `SELECT id, packaging_type FROM packaging_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const defaultCategoryId = categories[0]?.id || uuidv4();
    const systemUserId = adminUser[0]?.id || uuidv4();

    // Find UNSIZED size id to use for RAW products (raw materials should be UNSIZED & UNGRADED)
    const unsizedRow = await queryInterface.sequelize.query(
      `SELECT id FROM size_master WHERE size = 'UNSIZED' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const unsizedSizeId = unsizedRow[0]?.id || null;

    // Create product name mapping
    function generateProductName(speciesName, derivative, size, grade) {
      const cleanDerivative = derivative.replace(/_/g, " ");
      const cleanSize = size.replace(/_/g, "-");
      return `${speciesName} | ${cleanDerivative} | ${cleanSize} | ${grade}`;
    }

    // Determine product flags based on processing_type
    // is_raw = true only for UNPROCESSED derivatives (raw materials)
    // is_raw = false for all other processing types (processed products)
    function getProductFlags(processingType) {
      return {
        is_raw: processingType === "UNPROCESSED",
        is_producible: true,
        is_sellable: true,
      };
    }

    // Select appropriate packaging
    function selectPackaging() {
      if (packaging.length === 0) return null;
      return packaging[Math.floor(Math.random() * packaging.length)].id;
    }

    // Build product records
    const rows = [];
    let count = 0;

    for (const mapping of mappings) {
      const processingState =
        mapping.processing_type === "UNPROCESSED" ? "RAW" : "PROCESSED";

      // RAW products: Species + Derivative + Size only (no grade)
      // PROCESSED products: Species + Derivative + Size + Grade
      let productName;
      if (processingState === "RAW") {
        const cleanDerivative = mapping.derivative_code.replace(/_/g, " ");
        // RAW products are UNSIZED and UNGRADED. Use UNSIZED label for product name and size_master_id.
        const unsizedLabel = "UNSIZED";
        productName = `${mapping.species_name} | ${cleanDerivative} | ${unsizedLabel}`;
      } else {
        productName = generateProductName(
          mapping.species_name,
          mapping.derivative_code,
          mapping.size,
          mapping.grade_code,
        );
      }
      const flags = getProductFlags(mapping.processing_type);

      rows.push({
        id: uuidv4(),
        product_name: productName,
        product_category_master_id: defaultCategoryId,
        species_derivative_size_grade_mapping_id: mapping.mapping_id,
        derivative_master_id: mapping.derivative_master_id,
        // RAW products: set to UNSIZED size (if available) and no grade
        // PROCESSED products: have both size and grade
        size_master_id:
          processingState === "RAW" ? unsizedSizeId : mapping.size_master_id,
        grade_master_id:
          processingState === "RAW" ? null : mapping.grade_master_id,
        packaging_master_id: selectPackaging(),
        processing_state: processingState,
        product_role: "FINISHED_GOOD",
        is_raw: flags.is_raw,
        is_producible: flags.is_producible,
        is_sellable: flags.is_sellable,
        is_active: true,
        created_by: systemUserId,
        created_at: now,
        updated_at: now,
      });

      count++;

      if (count % 1000 === 0) {
        console.log(`  📍 Processed ${count} products...`);
      }
    }

    console.log(`\n✅ Prepared ${rows.length} product records\n`);

    // Insert in batches to avoid memory issues
    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await queryInterface.bulkInsert("product_master", batch, {});
      console.log(
        `  ✓ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`,
      );
    }

    console.log(
      `\n✅ Successfully populated product_master with ${rows.length} records\n`,
    );
  },

  async down(queryInterface) {
    // Delete products that reference species_derivative_size_grade_mapping
    await queryInterface.sequelize.query(
      `DELETE FROM product_master 
       WHERE species_derivative_size_grade_mapping_id IS NOT NULL`,
    );
  },
};
