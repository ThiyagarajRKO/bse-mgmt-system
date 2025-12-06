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

    // Insert comprehensive GST Masters
    const now = new Date();
    const effectiveFrom = new Date("2024-01-01");

    await queryInterface.bulkInsert(
      "consolidated_gst_master",
      [
        // ---- RAW SEAFOOD (5% GST) ----
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0303",
          gst_name: "Frozen fish",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0304",
          gst_name: "Fish fillets and minced meat (fresh or frozen)",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0305",
          gst_name: "Dried, salted or brined fish",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0306",
          gst_name:
            "Crustaceans (shrimp, prawns, lobster, crab) – fresh/frozen",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "0307",
          gst_name:
            "Molluscs (squid, cuttlefish, octopus, bivalves) – fresh/frozen",
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },

        // ---- COOKED / VALUE ADDED SEAFOOD (12% GST) ----
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16051000",
          gst_name: "Cooked, steamed or boiled shrimp & prawns",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16052010",
          gst_name: "Cooked, steamed crab meat (pasteurized)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16052900",
          gst_name: "Prepared or preserved crustaceans (non-canned)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16053000",
          gst_name: "Cooked or prepared molluscs (squid, octopus, scallops)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16054000",
          gst_name:
            "Cooked or prepared fish (grilled, smoked, steamed, marinated)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16055100",
          gst_name:
            "Breaded or battered seafood (ready-to-cook coated products)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16055900",
          gst_name:
            "Value-added seafood preparations (marinated, ready-to-eat packs)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16059010",
          gst_name: "Canned tuna, sardines, mackerel, salmon",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "16059090",
          gst_name: "Other prepared seafood (RTE/RTH products)",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },

        // ---- PACKAGING MATERIALS (18% GST) ----
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "39232100",
          gst_name: "LDPE / HDPE poly bags for food packaging",
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "39201099",
          gst_name: "Plastic film (vacuum pouches, shrink wrap)",
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "48192090",
          gst_name: "Corrugated cartons / master cartons",
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "48211010",
          gst_name: "Self-adhesive labels / printed barcode labels",
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },

        // ---- STATIONERY (12–18% GST) ----
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "48203000",
          gst_name: "Computer paper / printing paper",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 12,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
        },
        {
          id: Sequelize.literal("gen_random_uuid()"),
          hsn_code: "96081019",
          gst_name: "Ball pens / writing instruments",
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          effective_from: effectiveFrom,
          effective_to: null,
          company_id: "9d978ea8-732c-4dea-b968-ab7b9815832d",
          created_by: null,
          updated_by: null,
          created_at: now,
          updated_at: now,
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
