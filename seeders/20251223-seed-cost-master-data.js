"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing packaging IDs to use as references
    const packagingRecords = await queryInterface.sequelize.query(
      "SELECT id, packaging_code, packaging_type FROM packaging_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (packagingRecords.length === 0) {
      console.log(
        "No packaging records found. Skipping cost master data seeding."
      );
      return;
    }

    // Sample cost data for different packaging types
    const costData = [];

    // Packaging cost master data
    packagingRecords.forEach((packaging) => {
      let costPerUnit = 0;
      let costUom = "PCS";

      // Set sample costs based on packaging type
      switch (packaging.packaging_type) {
        case "VACUUM_POUCH":
          costPerUnit = 2.5; // ₹2.50 per pouch
          break;
        case "IQF_BAG":
          costPerUnit = 3.75; // ₹3.75 per bag
          break;
        case "TRAY":
          costPerUnit = 1.25; // ₹1.25 per tray
          break;
        case "BOX":
          costPerUnit = 5.0; // ₹5.00 per box
          costUom = "PCS";
          break;
        case "MC": // Master Carton
          costPerUnit = 25.0; // ₹25.00 per carton
          break;
        case "PALLET":
          costPerUnit = 150.0; // ₹150.00 per pallet
          break;
        default:
          costPerUnit = 1.0;
      }

      costData.push({
        id: Sequelize.literal("uuid_generate_v4()"),
        packaging_id: packaging.id,
        cost_per_unit: costPerUnit,
        cost_uom: costUom,
        effective_from: "2024-01-01",
        effective_to: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      });
    });

    // Insert packaging cost data
    if (costData.length > 0) {
      await queryInterface.bulkInsert("packaging_cost_master", costData);
      console.log(`Inserted ${costData.length} packaging cost records`);
    }

    // Carton cost master data (subset of master cartons)
    const cartonRecords = packagingRecords.filter(
      (p) => p.packaging_type === "MC"
    );
    const cartonCostData = cartonRecords.map((carton) => ({
      id: Sequelize.literal("uuid_generate_v4()"),
      carton_id: carton.id,
      cost_per_carton: 25.0, // ₹25.00 per master carton
      effective_from: "2024-01-01",
      effective_to: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null,
    }));

    if (cartonCostData.length > 0) {
      await queryInterface.bulkInsert("carton_cost_master", cartonCostData);
      console.log(`Inserted ${cartonCostData.length} carton cost records`);
    }

    // Pallet cost master data (subset of pallets)
    const palletRecords = packagingRecords.filter(
      (p) => p.packaging_type === "PALLET"
    );
    const palletCostData = palletRecords.map((pallet) => ({
      id: Sequelize.literal("uuid_generate_v4()"),
      pallet_id: pallet.id,
      cost_per_pallet: 150.0, // ₹150.00 per pallet
      effective_from: "2024-01-01",
      effective_to: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: null,
      updated_by: null,
    }));

    if (palletCostData.length > 0) {
      await queryInterface.bulkInsert("pallet_cost_master", palletCostData);
      console.log(`Inserted ${palletCostData.length} pallet cost records`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("pallet_cost_master", null, {});
    await queryInterface.bulkDelete("carton_cost_master", null, {});
    await queryInterface.bulkDelete("packaging_cost_master", null, {});
  },
};
