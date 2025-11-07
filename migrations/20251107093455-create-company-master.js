"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("company_master", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // ✅ Sequelize generates UUID
        primaryKey: true,
      },

      company_name: { type: Sequelize.STRING(150), allowNull: false },
      company_short_name: { type: Sequelize.STRING(150), allowNull: false },
      company_gstin: { type: Sequelize.STRING(150) },
      company_pan: { type: Sequelize.STRING(20) },
      company_address: { type: Sequelize.TEXT },
      company_country: { type: Sequelize.STRING(100) },
      company_bank_ac: { type: Sequelize.STRING(50) },
      company_ifsc: { type: Sequelize.STRING(20) },
      company_currency: { type: Sequelize.STRING(20) },
      company_fin_year_start: { type: Sequelize.STRING(20) },

      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },

      created_by: { type: Sequelize.UUID },
      updated_by: { type: Sequelize.UUID },

      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("company_master");
  },
};
