"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if sample data already exists
    const existingCOA = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM chart_of_accounts WHERE company_id = '9d978ea8-732c-4dea-b968-ab7b9815832d'"
    );

    if (existingCOA[0][0].count > 0) {
      console.log("Sample accounting data already exists, skipping seed.");
      return;
    }

    // Insert sample Chart of Accounts
    await queryInterface.bulkInsert(
      "chart_of_accounts",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          account_code: "1001",
          account_name: "Cash Account",
          account_type: "Asset",
          parent_account_id: null,
          level: 1,
          is_posting: true,
          is_active: true,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          account_code: "2001",
          account_name: "Sales Revenue",
          account_type: "Income",
          parent_account_id: null,
          level: 1,
          is_posting: true,
          is_active: true,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          account_code: "3001",
          account_name: "Cost of Goods Sold",
          account_type: "Expense",
          parent_account_id: null,
          level: 1,
          is_posting: true,
          is_active: true,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );

    // Insert sample GST Masters
    await queryInterface.bulkInsert(
      "consolidated_gst_master",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0301",
          gst_name: "GST 5% - Fish and crustaceans",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          effective_from: "2024-01-01",
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0302",
          gst_name: "GST 12% - Fish, fresh or chilled",
          cgst_rate: 6.0,
          sgst_rate: 6.0,
          igst_rate: 12.0,
          effective_from: "2024-01-01",
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0303",
          gst_name: "GST 18% - Fish, frozen",
          cgst_rate: 9.0,
          sgst_rate: 9.0,
          igst_rate: 18.0,
          effective_from: "2024-01-01",
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );

    // Insert sample Ledger Masters
    await queryInterface.bulkInsert(
      "ledger_master",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          ledger_code: "CGST001",
          ledger_name: "CGST Output",
          coa_account_id: Sequelize.literal(
            "(SELECT id FROM chart_of_accounts WHERE account_code = '2001' LIMIT 1)"
          ),
          bank_account_no: null,
          bank_name: null,
          bank_ifsc: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          ledger_code: "SGST001",
          ledger_name: "SGST Output",
          coa_account_id: Sequelize.literal(
            "(SELECT id FROM chart_of_accounts WHERE account_code = '2001' LIMIT 1)"
          ),
          bank_account_no: null,
          bank_name: null,
          bank_ifsc: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          ledger_code: "IGST001",
          ledger_name: "IGST Output",
          coa_account_id: Sequelize.literal(
            "(SELECT id FROM chart_of_accounts WHERE account_code = '2001' LIMIT 1)"
          ),
          bank_account_no: null,
          bank_name: null,
          bank_ifsc: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );

    // Insert sample Tax Codes
    await queryInterface.bulkInsert(
      "tax_code_master",
      [
        {
          id: Sequelize.literal("gen_random_uuid()"),
          tax_code: "GST18",
          tax_name: "GST 18% - CGST 9%, SGST 9%",
          hsn_code: "0303",
          gst_rate_percent: 18.0,
          ledger_cgst_id: Sequelize.literal(
            "(SELECT id FROM ledger_master WHERE ledger_code = 'CGST001' LIMIT 1)"
          ),
          ledger_sgst_id: Sequelize.literal(
            "(SELECT id FROM ledger_master WHERE ledger_code = 'SGST001' LIMIT 1)"
          ),
          ledger_igst_id: Sequelize.literal(
            "(SELECT id FROM ledger_master WHERE ledger_code = 'IGST001' LIMIT 1)"
          ),
          ledger_input_tax_id: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("tax_code_master", null, {});
    await queryInterface.bulkDelete("ledger_master", null, {});
    await queryInterface.bulkDelete("consolidated_gst_master", null, {});
    await queryInterface.bulkDelete("chart_of_accounts", null, {});
  },
};
