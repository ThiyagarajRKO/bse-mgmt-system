"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the company ID from the seeded company
    const companies = await queryInterface.sequelize.query(
      "SELECT id FROM company_master WHERE company_name = 'BSE Management System' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (companies.length === 0) {
      throw new Error(
        "No company found. Please run company_master seeder first."
      );
    }

    const companyId = companies[0].id;

    await queryInterface.bulkInsert(
      "division_master",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          division_name: "Operations Division",
          description: "Handles all operational activities",
          company_id: companyId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          division_name: "Finance Division",
          description: "Manages financial operations and accounting",
          company_id: companyId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          division_name: "HR Division",
          description: "Human resources and personnel management",
          company_id: companyId,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("division_master", null, {});
  },
};
