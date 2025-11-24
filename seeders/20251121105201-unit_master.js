"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "unit_master",
      [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          unit_code: "UNIT001",
          unit_name: "Main Processing Unit",
          company_id: "bse-company-001",
          location_master_id: "550e8400-e29b-41d4-a716-446655440000",
          unit_type: "Processing",
          created_by: "0a6495f7-7c0f-442c-aad0-a13d8c2d4ce5",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          unit_code: "UNIT002",
          unit_name: "Storage Facility",
          company_id: "bse-company-001",
          location_master_id: "550e8400-e29b-41d4-a716-446655440000",
          unit_type: "Storage",
          created_by: "0a6495f7-7c0f-442c-aad0-a13d8c2d4ce5",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("unit_master", null, {});
  },
};
