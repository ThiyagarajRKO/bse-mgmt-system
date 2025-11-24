"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "company_master",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          company_name: "BSE Management System",
          company_short_name: "BSE",
          company_gstin: "22AAAAA0000A1Z5",
          company_pan: "AAAAA0000A",
          company_address: "123 Main Street, City, State",
          company_country: "India",
          company_bank_ac: "1234567890",
          company_ifsc: "SBIN0001234",
          company_currency: "INR",
          company_fin_year_start: "2024-04-01",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
