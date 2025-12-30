"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("product_packaging_rules", [
      // =========================
      // FISH – FRESH (Unprocessed)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Fish",
        product_category: "Fresh",
        grade: null, // Applies to all grades
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "POLYBAG",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Fish",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // CRUSTACEAN – FRESH (Unprocessed)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Crustacean",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "POLYBAG",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Crustacean",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // BIVALVE – FRESH (Unprocessed)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Bivalve",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "POLYBAG",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Bivalve",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // CEPHALOPOD – FRESH (Unprocessed)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Cephalopod",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "POLYBAG",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Cephalopod",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // =========================
      // GASTROPOD – FRESH (Unprocessed)
      // =========================
      {
        id: uuidv4(),
        parent_category_type: "Gastropod",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "POLYBAG",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "MC",
        is_export: false,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      {
        id: uuidv4(),
        parent_category_type: "Gastropod",
        product_category: "Fresh",
        grade: null,
        min_net_weight_kg: 0,
        max_net_weight_kg: 999999,
        primary_packaging_type: "VAC",
        secondary_packaging_type: "BOX",
        tertiary_packaging_type: "PALLET",
        is_export: true,
        priority: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    // Delete all packing rules for fresh/unprocessed products
    await queryInterface.sequelize.query(
      `DELETE FROM product_packaging_rules 
       WHERE product_category = 'Fresh'
       AND grade IS NULL`
    );
  },
};
