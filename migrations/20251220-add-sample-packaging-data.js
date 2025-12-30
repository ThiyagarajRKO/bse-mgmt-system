"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get an existing supplier
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id FROM supplier_master WHERE is_active = true LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length === 0) {
      console.log("No suppliers found, skipping packaging creation");
      return;
    }

    const supplierId = suppliers[0].id;

    // First, create some basic packaging
    const packagingData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440200",
        packaging_code: "POUCH_250G",
        packaging_type: "Pouch",
        packaging_weight: 0.25,
        packaging_material_composition: "Plastic",
        supplier_master_id: supplierId,
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440201",
        packaging_code: "POUCH_500G",
        packaging_type: "Pouch",
        packaging_weight: 0.5,
        packaging_material_composition: "Plastic",
        supplier_master_id: supplierId,
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440202",
        packaging_code: "TRAY_1KG",
        packaging_type: "Duplex Carton",
        packaging_weight: 1.0,
        packaging_material_composition: "Cardboard",
        supplier_master_id: supplierId,
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("packaging_master", packagingData, {});

    // Now create mappings for the test product
    const mappingData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440300",
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57", // The test product
        packaging_id: "550e8400-e29b-41d4-a716-446655440200", // POUCH_250G
        market: "RETAIL",
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440301",
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57", // The test product
        packaging_id: "550e8400-e29b-41d4-a716-446655440201", // POUCH_500G
        market: "RETAIL",
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440302",
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57", // The test product
        packaging_id: "550e8400-e29b-41d4-a716-446655440202", // TRAY_1KG
        market: "RETAIL",
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert(
      "product_packaging_mapping",
      mappingData,
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      "product_packaging_mapping",
      {
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57",
      },
      {}
    );
    await queryInterface.bulkDelete(
      "packaging_master",
      {
        packaging_code: ["POUCH_250G", "POUCH_500G", "TRAY_1KG"],
      },
      {}
    );
  },
};
