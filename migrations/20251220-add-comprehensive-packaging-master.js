"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing suppliers
    const suppliers = await queryInterface.sequelize.query(
      "SELECT id, supplier_name FROM supplier_master WHERE is_active = true ORDER BY created_at LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (suppliers.length === 0) {
      console.log("No suppliers found, skipping packaging creation");
      return;
    }

    // Map supplier types to available suppliers
    const supplierMap = {
      PACK_PLASTIC_01: suppliers[0]?.id || suppliers[0]?.id,
      PACK_CARTON_01: suppliers[1]?.id || suppliers[0]?.id,
      PACK_TRAY_01: suppliers[2]?.id || suppliers[0]?.id,
      PACK_PALLET_01: suppliers[3]?.id || suppliers[0]?.id,
      PACK_LABEL_01: suppliers[4]?.id || suppliers[0]?.id,
    };

    const now = new Date();

    // Check for existing packaging codes to avoid duplicates
    const existingCodes = await queryInterface.sequelize.query(
      "SELECT packaging_code FROM packaging_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingCodeSet = new Set(existingCodes.map((p) => p.packaging_code));

    const packagingData = [
      // =========================
      // PRIMARY – FOOD CONTACT
      // =========================
      {
        id: uuidv4(),
        packaging_code: "VAC-15x20x2-18G",
        packaging_type: "PRIMARY",
        packaging_height: 20,
        packaging_width: 15,
        packaging_length: 2,
        packaging_weight: 18,
        packaging_material_composition: "Nylon/PE multilayer (food grade)",
        supplier_master_id: supplierMap["PACK_PLASTIC_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
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
        supplier_master_id: supplierMap["PACK_PLASTIC_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
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
        supplier_master_id: supplierMap["PACK_PLASTIC_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "IQF-35x45x5-75G",
        packaging_type: "PRIMARY",
        packaging_height: 45,
        packaging_width: 35,
        packaging_length: 5,
        packaging_weight: 75,
        packaging_material_composition: "LDPE heavy gauge (IQF export)",
        supplier_master_id: supplierMap["PACK_PLASTIC_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },

      // =========================
      // SECONDARY – RETAIL / INNER
      // =========================
      {
        id: uuidv4(),
        packaging_code: "BOX-18x12x6-65G",
        packaging_type: "SECONDARY",
        packaging_height: 6,
        packaging_width: 12,
        packaging_length: 18,
        packaging_weight: 65,
        packaging_material_composition: "Duplex board with food-safe ink",
        supplier_master_id: supplierMap["PACK_CARTON_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "BOX-22x15x7-85G",
        packaging_type: "SECONDARY",
        packaging_height: 7,
        packaging_width: 15,
        packaging_length: 22,
        packaging_weight: 85,
        packaging_material_composition: "Laminated duplex board",
        supplier_master_id: supplierMap["PACK_CARTON_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "TRAY-20x14x4-28G",
        packaging_type: "SECONDARY",
        packaging_height: 4,
        packaging_width: 14,
        packaging_length: 20,
        packaging_weight: 28,
        packaging_material_composition: "PET thermoformed tray",
        supplier_master_id: supplierMap["PACK_TRAY_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },

      // =========================
      // TERTIARY – EXPORT / LOGISTICS
      // =========================
      {
        id: uuidv4(),
        packaging_code: "MC-40x30x18-450G",
        packaging_type: "TERTIARY",
        packaging_height: 18,
        packaging_width: 30,
        packaging_length: 40,
        packaging_weight: 450,
        packaging_material_composition: "5-ply corrugated master carton",
        supplier_master_id: supplierMap["PACK_CARTON_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "MC-45x35x22-650G",
        packaging_type: "TERTIARY",
        packaging_height: 22,
        packaging_width: 35,
        packaging_length: 45,
        packaging_weight: 650,
        packaging_material_composition:
          "7-ply corrugated carton (export grade)",
        supplier_master_id: supplierMap["PACK_CARTON_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "PALLET-120x100x15-25KG",
        packaging_type: "TERTIARY",
        packaging_height: 15,
        packaging_width: 100,
        packaging_length: 120,
        packaging_weight: 25000,
        packaging_material_composition: "Heat-treated wooden pallet (ISPM-15)",
        supplier_master_id: supplierMap["PACK_PALLET_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },

      // =========================
      // ACCESSORY
      // =========================
      {
        id: uuidv4(),
        packaging_code: "LABEL-6x3x0.1-2G",
        packaging_type: "ACCESSORY",
        packaging_height: 3,
        packaging_width: 6,
        packaging_length: 0.1,
        packaging_weight: 2,
        packaging_material_composition: "Paper label with adhesive",
        supplier_master_id: supplierMap["PACK_LABEL_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "STRAP-10x10x10-1200G",
        packaging_type: "ACCESSORY",
        packaging_height: 10,
        packaging_width: 10,
        packaging_length: 10,
        packaging_weight: 1200,
        packaging_material_composition: "Polypropylene strapping roll",
        supplier_master_id: supplierMap["PACK_CARTON_01"],
        is_active: true,
        created_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        updated_by: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        created_at: now,
        updated_at: now,
      },
    ];

    // Filter out duplicates
    const newPackagingData = packagingData.filter(
      (pkg) => !existingCodeSet.has(pkg.packaging_code)
    );

    if (newPackagingData.length > 0) {
      await queryInterface.bulkInsert("packaging_master", newPackagingData, {});
      console.log(`Added ${newPackagingData.length} new packaging items`);
    } else {
      console.log("No new packaging items to add (all codes already exist)");
    }
  },

  down: async (queryInterface, Sequelize) => {
    const codesToRemove = [
      "VAC-15x20x2-18G",
      "VAC-18x25x2-24G",
      "IQF-30x20x4-30G",
      "IQF-35x45x5-75G",
      "BOX-18x12x6-65G",
      "BOX-22x15x7-85G",
      "TRAY-20x14x4-28G",
      "MC-40x30x18-450G",
      "MC-45x35x22-650G",
      "PALLET-120x100x15-25KG",
      "LABEL-6x3x0.1-2G",
      "STRAP-10x10x10-1200G",
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
