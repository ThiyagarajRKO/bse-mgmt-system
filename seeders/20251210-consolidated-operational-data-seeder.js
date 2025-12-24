"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED OPERATIONAL DATA SEEDER
 *
 * This seeder consolidates the following individual seeders:
 * - 20251207000002-seed-procurement-data.js
 * - 20251207000003-seed-operational-data.js
 * - 20251219-packing-rules.js
 * - 20251224000000-generate-real-profitability-data.js
 *
 * Creates comprehensive operational data including procurement records,
 * operational metrics, packing rules, and profitability calculations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting consolidated operational data seeding...");

    // ============================================================================
    // PHASE 1: SEED PACKING RULES
    // ============================================================================

    console.log("Seeding Packing Rules...");

    // Get existing product categories and sizes for packing rules
    const productCategories = await queryInterface.sequelize.query(
      `SELECT pcm.id, pcm.product_category, sm.species_name
       FROM product_category_master pcm
       JOIN species_master sm ON pcm.species_master_id = sm.id
       WHERE pcm.is_active = true AND sm.is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const sizes = await queryInterface.sequelize.query(
      "SELECT id, size FROM size_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const packagingTypes = await queryInterface.sequelize.query(
      "SELECT id, packaging_code, packaging_type FROM packaging_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (
      productCategories.length > 0 &&
      sizes.length > 0 &&
      packagingTypes.length > 0
    ) {
      const packingRules = [];

      // Create packing rules for each combination
      productCategories.forEach((category) => {
        sizes.forEach((size) => {
          // Primary packaging (IQF bags for most products)
          const primaryPackaging =
            packagingTypes.find((p) => p.packaging_type === "IQF_BAG") ||
            packagingTypes.find((p) => p.packaging_type === "VACUUM_POUCH");

          if (primaryPackaging) {
            packingRules.push({
              id: uuidv4(),
              product_category_master_id: category.id,
              size_master_id: size.id,
              primary_packaging_id: primaryPackaging.id,
              primary_packaging_quantity: 1,
              secondary_packaging_id: null,
              secondary_packaging_quantity: null,
              tertiary_packaging_id: null,
              tertiary_packaging_quantity: null,
              net_weight_kg: 1.0,
              gross_weight_kg: 1.1,
              is_active: true,
              created_by: systemUserId,
              updated_by: systemUserId,
              created_at: now,
              updated_at: now,
            });
          }
        });
      });

      // Check for existing packing rules
      const existingPackingRulesCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM packing_rules",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingPackingRulesCount[0].count === 0) {
        await queryInterface.bulkInsert("packing_rules", packingRules, {});
        console.log(`Inserted ${packingRules.length} packing rules`);
      } else {
        console.log(`Packing rules already exist, skipping...`);
      }
    }

    // ============================================================================
    // PHASE 2: SEED SAMPLE PROCUREMENT DATA
    // ============================================================================

    console.log("Seeding Sample Procurement Data...");

    // Get suppliers, species, and locations for procurement data
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id, supplier_name FROM supplier_master WHERE is_active = true LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const species = await queryInterface.sequelize.query(
      "SELECT id, species_name FROM species_master WHERE is_active = true LIMIT 3",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const locations = await queryInterface.sequelize.query(
      "SELECT id, location_name FROM location_master WHERE is_active = true LIMIT 3",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length > 0 && species.length > 0 && locations.length > 0) {
      const procurementLots = [];

      // Create sample procurement lots
      for (let i = 0; i < 10; i++) {
        const supplier = suppliers[i % suppliers.length];
        const spec = species[i % species.length];
        const location = locations[i % locations.length];

        procurementLots.push({
          id: uuidv4(),
          lot_number: `LOT-${new Date().getFullYear()}-${String(i + 1).padStart(
            3,
            "0"
          )}`,
          supplier_master_id: supplier.id,
          species_master_id: spec.id,
          location_master_id: location.id,
          procurement_date: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          ), // Random date in last 30 days
          quantity_kg: Math.floor(Math.random() * 1000) + 100,
          unit_price: Math.floor(Math.random() * 200) + 50,
          total_amount: 0, // Will be calculated
          quality_grade: ["A", "B", "C"][Math.floor(Math.random() * 3)],
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        });
      }

      // Calculate total amounts
      procurementLots.forEach((lot) => {
        lot.total_amount = lot.quantity_kg * lot.unit_price;
      });

      // Check for existing procurement data
      const existingProcurementCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM procurement_lots",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingProcurementCount[0].count === 0) {
        await queryInterface.bulkInsert(
          "procurement_lots",
          procurementLots,
          {}
        );
        console.log(
          `Inserted ${procurementLots.length} sample procurement lots`
        );
      } else {
        console.log(`Procurement data already exists, skipping...`);
      }
    }

    // ============================================================================
    // PHASE 3: SEED OPERATIONAL METRICS
    // ============================================================================

    console.log("Seeding Operational Metrics...");

    // Get procurement lots for operational data
    const procurementLots = await queryInterface.sequelize.query(
      "SELECT id, lot_number, quantity_kg FROM procurement_lots WHERE is_active = true LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (procurementLots.length > 0) {
      const operationalData = [];

      procurementLots.forEach((lot) => {
        // Peeling operation
        operationalData.push({
          id: uuidv4(),
          procurement_lot_id: lot.id,
          operation_type: "PEELING",
          input_quantity: lot.quantity_kg,
          output_quantity: lot.quantity_kg * 0.85, // 15% loss
          yield_percentage: 85.0,
          operation_date: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ), // Random date in last 7 days
          operator_name: "System Operator",
          notes: "Automated peeling operation",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        });

        // Packing operation
        operationalData.push({
          id: uuidv4(),
          procurement_lot_id: lot.id,
          operation_type: "PACKING",
          input_quantity: lot.quantity_kg * 0.85,
          output_quantity: lot.quantity_kg * 0.83, // Additional 2% loss
          yield_percentage: 97.65,
          operation_date: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ),
          operator_name: "System Operator",
          notes: "IQF packing operation",
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        });
      });

      // Check for existing operational data
      const existingOperationalCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM peeling",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingOperationalCount[0].count === 0) {
        await queryInterface.bulkInsert("peeling", operationalData, {});
        console.log(`Inserted ${operationalData.length} operational records`);
      } else {
        console.log(`Operational data already exists, skipping...`);
      }
    }

    // ============================================================================
    // PHASE 4: GENERATE PROFITABILITY DATA
    // ============================================================================

    console.log("Generating Profitability Data...");

    // Get products and procurement data for profitability calculations
    const products = await queryInterface.sequelize.query(
      `SELECT pm.id, pm.product_name, pm.hsn_code, pcm.product_category, sm.species_name
       FROM product_master pm
       JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
       JOIN species_master sm ON pm.species_master_id = sm.id
       WHERE pm.is_active = true
       LIMIT 10`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (products.length > 0) {
      const profitabilityData = [];

      products.forEach((product) => {
        // Calculate sample profitability metrics
        const procurementCost = Math.floor(Math.random() * 150) + 50; // ₹50-200/kg
        const processingCost = procurementCost * 0.25; // 25% processing cost
        const packagingCost = procurementCost * 0.1; // 10% packaging cost
        const totalCost = procurementCost + processingCost + packagingCost;
        const sellingPrice = totalCost * 1.35; // 35% margin
        const profitMargin = ((sellingPrice - totalCost) / totalCost) * 100;

        profitabilityData.push({
          id: uuidv4(),
          product_master_id: product.id,
          procurement_cost_per_kg: procurementCost,
          processing_cost_per_kg: processingCost,
          packaging_cost_per_kg: packagingCost,
          total_cost_per_kg: totalCost,
          selling_price_per_kg: sellingPrice,
          profit_margin_percentage: profitMargin,
          calculation_date: now,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        });
      });

      // Check for existing profitability data
      const existingProfitabilityCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM profitability_analysis",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingProfitabilityCount[0].count === 0) {
        await queryInterface.bulkInsert(
          "profitability_analysis",
          profitabilityData,
          {}
        );
        console.log(
          `Inserted ${profitabilityData.length} profitability analysis records`
        );
      } else {
        console.log(`Profitability data already exists, skipping...`);
      }
    }

    console.log("Consolidated operational data seeding completed successfully");
  },

  async down(queryInterface, Sequelize) {
    // Remove in reverse order
    await queryInterface.bulkDelete(
      "profitability_analysis",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "peeling",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "procurement_lots",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "packing_rules",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );
  },
};
