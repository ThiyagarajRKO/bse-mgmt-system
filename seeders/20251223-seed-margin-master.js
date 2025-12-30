"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, get some existing species IDs from the database
    const species = await queryInterface.sequelize.query(
      "SELECT id FROM species_master LIMIT 3",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (species.length === 0) {
      console.log("No species found in database. Skipping margin master seed.");
      return;
    }

    const marginData = [];

    // Create margin configurations for each species
    species.forEach((speciesRecord) => {
      // Domestic Market Margins
      marginData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        product_form: "FROZEN",
        market: "DOMESTIC",
        target_margin_pct: 25.0,
        min_margin_pct: 15.0,
        yield_tolerance_pct: 5.0,
        auto_uplift_pct: 10.0,
        approval_required_pct: 15.0,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      marginData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        product_form: "COOKED",
        market: "DOMESTIC",
        target_margin_pct: 30.0,
        min_margin_pct: 20.0,
        yield_tolerance_pct: 3.0,
        auto_uplift_pct: 8.0,
        approval_required_pct: 12.0,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      marginData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        product_form: "FRESH",
        market: "DOMESTIC",
        target_margin_pct: 20.0,
        min_margin_pct: 10.0,
        yield_tolerance_pct: 7.0,
        auto_uplift_pct: 12.0,
        approval_required_pct: 18.0,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Export Market Margins (Higher margins for export)
      marginData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        product_form: "FROZEN",
        market: "EXPORT",
        target_margin_pct: 35.0,
        min_margin_pct: 25.0,
        yield_tolerance_pct: 3.0,
        auto_uplift_pct: 8.0,
        approval_required_pct: 10.0,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      marginData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        product_form: "COOKED",
        market: "EXPORT",
        target_margin_pct: 40.0,
        min_margin_pct: 30.0,
        yield_tolerance_pct: 2.0,
        auto_uplift_pct: 6.0,
        approval_required_pct: 8.0,
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    await queryInterface.bulkInsert("margin_master", marginData, {});
    console.log(
      `Seeded ${marginData.length} margin configurations for ${species.length} species`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("margin_master", null, {});
  },
};
