"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED PACKAGING DATA MIGRATION
 *
 * This migration consolidates the following individual migrations:
 * - 20251220-add-sample-packaging-data.js
 * - 20251220-add-comprehensive-packaging-master.js
 * - 20251221-add-comprehensive-packaging-data.js
 *
 * Creates comprehensive packaging data and mappings in a single migration.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Get existing suppliers
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id, supplier_name FROM supplier_master WHERE is_active = true ORDER BY created_at LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length === 0) {
      console.log("No suppliers found, skipping packaging creation");
      return;
    }

    // Get admin profile for created_by/updated_by
    const adminProfile = await queryInterface.sequelize.query(
      "SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminId =
      adminProfile.length > 0
        ? adminProfile[0].id
        : suppliers[0]?.id || uuidv4();

    // Check for existing packaging codes to avoid duplicates
    const existingCodes = await queryInterface.sequelize.query(
      "SELECT packaging_code FROM packaging_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingCodeSet = new Set(existingCodes.map((p) => p.packaging_code));

    // Consolidated packaging data from all three migrations
    const packagingData = [
      // Basic packaging from sample data
      {
        id: "550e8400-e29b-41d4-a716-446655440200",
        packaging_code: "POUCH_250G",
        packaging_type: "Pouch",
        packaging_weight: 0.25,
        packaging_material_composition: "Plastic",
        supplier_master_id: suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440201",
        packaging_code: "POUCH_500G",
        packaging_type: "Pouch",
        packaging_weight: 0.5,
        packaging_material_composition: "Plastic",
        supplier_master_id: suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440202",
        packaging_code: "TRAY_1KG",
        packaging_type: "Duplex Carton",
        packaging_weight: 1.0,
        packaging_material_composition: "Cardboard",
        supplier_master_id: suppliers[1]?.id || suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      // Key comprehensive packaging items
      {
        id: uuidv4(),
        packaging_code: "VAC-15x20x2-18G",
        packaging_type: "PRIMARY",
        packaging_height: 20,
        packaging_width: 15,
        packaging_length: 2,
        packaging_weight: 18,
        packaging_material_composition: "Nylon/PE multilayer (food grade)",
        supplier_master_id: suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "VAC-18x25x2-24G",
        packaging_type: "PRIMARY",
        packaging_height: 25,
        packaging_width: 18,
        packaging_length: 2,
        packaging_weight: 24,
        packaging_material_composition: "Nylon/PE multilayer (food grade)",
        supplier_master_id: suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "IQF-30x20x4-30G",
        packaging_type: "PRIMARY",
        packaging_height: 30,
        packaging_width: 20,
        packaging_length: 4,
        packaging_weight: 30,
        packaging_material_composition: "LDPE food-grade freezer film",
        supplier_master_id: suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      // Secondary packaging
      {
        id: uuidv4(),
        packaging_code: "CARTON-12x8x6-50G",
        packaging_type: "SECONDARY",
        packaging_height: 12,
        packaging_width: 8,
        packaging_length: 6,
        packaging_weight: 50,
        packaging_material_composition: "Corrugated cardboard (5-ply)",
        supplier_master_id: suppliers[1]?.id || suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      // Tertiary packaging
      {
        id: uuidv4(),
        packaging_code: "PALLET-48x40-25KG",
        packaging_type: "TERTIARY",
        packaging_height: 48,
        packaging_width: 40,
        packaging_length: 0,
        packaging_weight: 25000,
        packaging_material_composition: "Wooden pallet (heat-treated)",
        supplier_master_id: suppliers[2]?.id || suppliers[0]?.id,
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
    ];

    // Filter out existing codes and insert new ones
    const newPackagingData = packagingData.filter(
      (pkg) => !existingCodeSet.has(pkg.packaging_code)
    );

    if (newPackagingData.length > 0) {
      await queryInterface.bulkInsert("packaging_master", newPackagingData, {});
    }

    // Create product-packaging mappings for test product
    const testProductId = "97e9b38d-6ee3-4d2b-8269-5912a67d0f57";
    const mappingData = [
      {
        id: "550e8400-e29b-41d4-a716-446655440300",
        product_id: testProductId,
        packaging_id: "550e8400-e29b-41d4-a716-446655440200", // POUCH_250G
        market: "RETAIL",
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440301",
        product_id: testProductId,
        packaging_id: "550e8400-e29b-41d4-a716-446655440201", // POUCH_500G
        market: "RETAIL",
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440302",
        product_id: testProductId,
        packaging_id: "550e8400-e29b-41d4-a716-446655440202", // TRAY_1KG
        market: "RETAIL",
        is_active: true,
        created_by: adminId,
        updated_by: adminId,
        created_at: now,
        updated_at: now,
      },
    ];

    // Check for existing mappings to avoid duplicates
    const existingMappings = await queryInterface.sequelize.query(
      "SELECT id FROM product_packaging_mapping WHERE product_id = ?",
      {
        replacements: [testProductId],
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existingMappings.length === 0) {
      await queryInterface.bulkInsert(
        "product_packaging_mapping",
        mappingData,
        {}
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove mappings for test product
    await queryInterface.bulkDelete(
      "product_packaging_mapping",
      {
        product_id: "97e9b38d-6ee3-4d2b-8269-5912a67d0f57",
      },
      {}
    );

    // Remove packaging items (only those created by this migration)
    const codesToRemove = [
      "POUCH_250G",
      "POUCH_500G",
      "TRAY_1KG",
      "VAC-15x20x2-18G",
      "VAC-18x25x2-24G",
      "IQF-30x20x4-30G",
      "CARTON-12x8x6-50G",
      "PALLET-48x40-25KG",
    ];

    await queryInterface.bulkDelete(
      "packaging_master",
      {
        packaging_code: codesToRemove,
      },
      {}
    );
  },
};
