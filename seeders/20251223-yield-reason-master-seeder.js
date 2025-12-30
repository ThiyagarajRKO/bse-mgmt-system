"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert yield reason master data
    await queryInterface.bulkInsert("yield_reason_master", [
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "LOW_YIELD",
        reason_description: "Yield below expected standards",
        category: "PROCESSING_LOSS",
        requires_supervisor_approval: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "OVER_TRIM",
        reason_description: "Excessive trimming during processing",
        category: "OVER_PROCESSING",
        requires_supervisor_approval: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "OVER_GLAZE",
        reason_description: "Excessive glazing applied",
        category: "OVER_PROCESSING",
        requires_supervisor_approval: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "COOKING_LOSS",
        reason_description: "Weight loss during cooking process",
        category: "PROCESSING_LOSS",
        requires_supervisor_approval: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "HANDLING_DAMAGE",
        reason_description: "Damage during handling and transportation",
        category: "HANDLING_DAMAGE",
        requires_supervisor_approval: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
      {
        id: Sequelize.literal("gen_random_uuid()"),
        reason_code: "MIXED_BATCH",
        reason_description: "Mixed batches affecting yield consistency",
        category: "QUALITY_ISSUE",
        requires_supervisor_approval: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: null,
        updated_by: null,
      },
    ]);

    // Note: Yield standards would be inserted separately after species are available
    // This seeder focuses on the reason codes which are universal
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("yield_reason_master", null, {});
  },
};
