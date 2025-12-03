"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert product_category_master records
    // Resolve species_master IDs from species codes/names (avoid hardcoded UUIDs)
    const speciesRows = await queryInterface.sequelize.query(
      "SELECT id, species_code, species_name FROM species_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const speciesMap = {};
    speciesRows.forEach((s) => {
      if (s.species_code) speciesMap[s.species_code] = s.id;
      if (s.species_name && !speciesMap[s.species_name])
        speciesMap[s.species_name] = s.id;
    });

    const productCategories = [
      {
        id: "550e8400-e29b-41d4-a716-446655440030",
        product_category: "Whole Fish",
        species_key: "5005", // will be replaced with actual id
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440031",
        product_category: "Fillets",
        species_key: "5005",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440032",
        product_category: "Peeled Shrimp",
        species_key: "5006",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440033",
        product_category: "Whole Shrimp",
        species_key: "5006",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440034",
        product_category: "Salmon Fillets",
        species_key: "5007",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440035",
        product_category: "Crab Meat",
        species_key: "C001",
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440036",
        product_category: "Lobster Tails",
        species_key: "5013",
      },
    ];

    const productCategoryRows = productCategories.map((pc) => ({
      id: pc.id,
      product_category: pc.product_category,
      species_master_id: speciesMap[pc.species_key] || null,
      is_active: true,
      created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert(
      "product_category_master",
      productCategoryRows,
      { ignoreDuplicates: true }
    );

    // Insert product_master records
    // Dynamically resolve size_master IDs (avoid hardcoded UUIDs)
    const sizeRows = await queryInterface.sequelize.query(
      "SELECT id, size FROM size_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const sizeMap = {};
    sizeRows.forEach((s) => {
      sizeMap[s.size] = s.id;
    });

    // Use actual available sizes
    const firstSize = sizeRows[0]?.id;
    const lastSize = sizeRows[sizeRows.length - 1]?.id || firstSize;

    const products = [
      {
        id: "550e8400-e29b-41d4-a716-446655440050",
        product_name: "Yellowfin Tuna Whole",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440030",
        size_id: lastSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440051",
        product_name: "Skipjack Tuna Fillets",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440031",
        size_id: firstSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440052",
        product_name: "White Shrimp Peeled",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440032",
        size_id: firstSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440053",
        product_name: "Black Tiger Shrimp Whole",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440033",
        size_id: firstSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440054",
        product_name: "Atlantic Salmon Fillets",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440034",
        size_id: lastSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440055",
        product_name: "Blue Crab Meat",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440035",
        size_id: firstSize,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440056",
        product_name: "Maine Lobster Tails",
        product_category_master_id: "550e8400-e29b-41d4-a716-446655440036",
        size_id: lastSize,
      },
    ];

    const productRows = products.map((p) => ({
      id: p.id,
      product_name: p.product_name,
      product_category_master_id: p.product_category_master_id,
      size_master_id: p.size_id,
      is_active: true,
      created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert("product_master", productRows, {
      ignoreDuplicates: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("product_master", null, {});
    await queryInterface.bulkDelete("product_category_master", null, {});
  },
};
