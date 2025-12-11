"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert basic tax codes for seafood products
    await queryInterface.bulkInsert(
      "tax_code_master",
      [
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_SEAFOOD_OUTWARD",
          tax_code_name: "Seafood Sales - Outward Supply",
          description: "GST for seafood product sales",
          tax_type: "GST",
          supply_type: "OUTWARD",
          hsn_code: "0303", // Frozen fish
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_CRUSTACEANS_OUTWARD",
          tax_code_name: "Crustaceans Sales - Outward Supply",
          description: "GST for crustaceans and shellfish sales",
          tax_type: "GST",
          supply_type: "OUTWARD",
          hsn_code: "0306", // Crustaceans
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_FISH_FILLETS_OUTWARD",
          tax_code_name: "Fish Fillets Sales - Outward Supply",
          description: "GST for fish fillets sales",
          tax_type: "GST",
          supply_type: "OUTWARD",
          hsn_code: "0304", // Fish fillets
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_SEAFOOD_INWARD",
          tax_code_name: "Seafood Procurement - Inward Supply",
          description: "GST for seafood procurement",
          tax_type: "GST",
          supply_type: "INWARD",
          hsn_code: "0303", // Frozen fish
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          tax_code_id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "TC_EXPORT_SEAFOOD",
          tax_code_name: "Seafood Export",
          description: "GST for seafood exports",
          tax_type: "GST",
          supply_type: "OUTWARD",
          hsn_code: "0303", // Frozen fish
          is_active: true,
          effective_from: "2024-01-01",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );

    console.log("Tax codes seeded successfully");
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("tax_code_master", null, {});
  },
};
