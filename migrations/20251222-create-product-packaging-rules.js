"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("product_packaging_rules", [
      // =========================
      // FISH – FROZEN
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Fish",
        product_category: "Frozen",
        grade: "A",
        min_net_weight_kg: 0.25,
        max_net_weight_kg: 2.0,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Fish",
        product_category: "Frozen",
        grade: "Export",
        min_net_weight_kg: 1.0,
        max_net_weight_kg: 10.0,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // CRUSTACEAN – IQF
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Crustacean",
        product_category: "Frozen",
        grade: "A",
        min_net_weight_kg: 0.2,
        max_net_weight_kg: 5.0,
        primary_packaging_type: "IQF",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Crustacean",
        product_category: "Frozen",
        grade: "Export",
        min_net_weight_kg: 1.0,
        max_net_weight_kg: 20.0,
        primary_packaging_type: "IQF",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // CEPHALOPOD – FROZEN
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Cephalopod",
        product_category: "Frozen",
        grade: "A",
        min_net_weight_kg: 0.3,
        max_net_weight_kg: 3.0,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // COOKED / RTE (ALL)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "ALL",
        product_category: "Cooked",
        grade: null,
        min_net_weight_kg: 0.2,
        max_net_weight_kg: 2.0,
        primary_packaging_type: "TRAY",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("product_packaging_rules", null, {});
  },
};
