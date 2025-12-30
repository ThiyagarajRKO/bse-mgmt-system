"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, get some existing species IDs from the database
    const species = await queryInterface.sequelize.query(
      "SELECT id FROM species_master LIMIT 3",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (species.length === 0) {
      console.log(
        "No species found in database. Skipping processing cost master seed."
      );
      return;
    }

    const processingCostData = [];

    // Create processing cost configurations for each species
    species.forEach((speciesRecord) => {
      processingCostData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        process_type: "WHOLE",
        cost_per_kg: 15.0, // Cost per kg for whole processing
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      processingCostData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        process_type: "FILLET",
        cost_per_kg: 25.0, // Higher cost for filleting
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      processingCostData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        process_type: "STEAK",
        cost_per_kg: 30.0, // Higher cost for steak cutting
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });

      processingCostData.push({
        id: Sequelize.literal("gen_random_uuid()"),
        species_id: speciesRecord.id,
        process_type: "MINCE",
        cost_per_kg: 20.0, // Cost for mincing
        is_active: true,
        effective_from: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    await queryInterface.bulkInsert(
      "processing_cost_master",
      processingCostData,
      {}
    );
    console.log(
      `Seeded ${processingCostData.length} processing cost configurations for ${species.length} species`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("processing_cost_master", null, {});
  },
};
