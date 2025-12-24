"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED ACCOUNTING & FINANCIAL MASTER SEEDER
 *
 * This seeder consolidates the following individual seeders:
 * - 20251125000001-sample-accounting-data.js
 * - 20251125165148-add-seafood-gst-records.js
 * - 20251201000000-accounting-tax-gst-master.js
 * - 20251205134601-add-comprehensive-gst-master-data.js
 * - 20251206000001-product-taxcode-gst-mapping.js
 * - 20251207000001-basic-tax-codes.js
 * - 20251207000001-populate-product-gst-mapping-full.js
 * - 20251208000000-seed-gl-account-master.js
 * - 20251212000000-seed-all-product-gst-mappings.js
 * - 20251223-posting-rules-seeder.js
 * - 20251223-seed-cost-master-data.js
 * - 20251223-seed-margin-master.js
 * - 20251223-seed-processing-cost-master.js
 * - 20251223-yield-reason-master-seeder.js
 * - 20251224000000-generate-real-profitability-data.js
 *
 * Creates comprehensive accounting and financial master data including GL accounts,
 * GST mappings, cost structures, profitability rules, and posting configurations.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log(
      "Starting consolidated accounting & financial master seeding..."
    );

    // ============================================================================
    // PHASE 1: SEED GL ACCOUNT MASTER
    // ============================================================================

    console.log("Seeding GL Account Master...");

    // Helper function to create GL account rows
    function createGLAccount(code, name, type, group, opts = {}) {
      return {
        id: uuidv4(),
        account_code: code,
        account_name: name,
        account_type: type,
        account_group: group,
        parent_account_code: opts.parent || null,
        is_posting_account: opts.is_posting ?? true,
        is_tax_ledger: opts.is_tax ?? false,
        gst_component: opts.gst_component || null,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      };
    }

    // Check if GL accounts already exist
    const existingGLCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM gl_account_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingGLCount[0].count === 0) {
      const glAccounts = [
        // Current Assets
        createGLAccount("1100", "Cash on Hand", "Asset", "Current Assets"),
        createGLAccount("1110", "Bank – INR", "Asset", "Current Assets"),
        createGLAccount("1120", "Bank – USD", "Asset", "Current Assets"),
        createGLAccount(
          "1200",
          "Accounts Receivable",
          "Asset",
          "Current Assets"
        ),
        createGLAccount(
          "1300",
          "Advances to Suppliers",
          "Asset",
          "Current Assets"
        ),
        createGLAccount("1400", "Prepaid Expenses", "Asset", "Current Assets"),

        // GST Input Accounts
        createGLAccount("1501", "CGST Input", "Asset", "GST Accounts", {
          is_tax: true,
          gst_component: "CGST",
        }),
        createGLAccount("1502", "SGST Input", "Asset", "GST Accounts", {
          is_tax: true,
          gst_component: "SGST",
        }),
        createGLAccount("1503", "IGST Input", "Asset", "GST Accounts", {
          is_tax: true,
          gst_component: "IGST",
        }),

        // Inventory
        createGLAccount("1600", "Raw Seafood Inventory", "Asset", "Inventory"),
        createGLAccount("1610", "Value Added Inventory", "Asset", "Inventory"),
        createGLAccount("1620", "Packaging Inventory", "Asset", "Inventory"),
        createGLAccount(
          "1630",
          "Finished Goods Inventory",
          "Asset",
          "Inventory"
        ),

        // Fixed Assets
        createGLAccount(
          "1700",
          "Machinery & Equipment",
          "Asset",
          "Fixed Assets"
        ),
        createGLAccount("1710", "Vehicles", "Asset", "Fixed Assets"),
        createGLAccount(
          "1720",
          "Accumulated Depreciation",
          "Asset",
          "Fixed Assets"
        ),

        // Current Liabilities
        createGLAccount(
          "3100",
          "Accounts Payable",
          "Liability",
          "Current Liabilities"
        ),
        createGLAccount(
          "3110",
          "Wages Payable",
          "Liability",
          "Current Liabilities"
        ),
        createGLAccount(
          "3120",
          "TDS Payable",
          "Liability",
          "Current Liabilities"
        ),
        createGLAccount(
          "3130",
          "Vendor Advances",
          "Liability",
          "Current Liabilities"
        ),

        // GST Output Accounts
        createGLAccount("3501", "CGST Output", "Liability", "GST Accounts", {
          is_tax: true,
          gst_component: "CGST",
        }),
        createGLAccount("3502", "SGST Output", "Liability", "GST Accounts", {
          is_tax: true,
          gst_component: "SGST",
        }),
        createGLAccount("3503", "IGST Output", "Liability", "GST Accounts", {
          is_tax: true,
          gst_component: "IGST",
        }),

        // Long-term Liabilities
        createGLAccount(
          "3600",
          "Bank Loans",
          "Liability",
          "Long-term Liabilities"
        ),
        createGLAccount(
          "3610",
          "Working Capital Loan",
          "Liability",
          "Long-term Liabilities"
        ),

        // Equity
        createGLAccount("4100", "Share Capital", "Equity", "Equity"),
        createGLAccount("4200", "Retained Earnings", "Equity", "Equity"),
        createGLAccount("4300", "Current Year P&L", "Equity", "Equity"),

        // Revenue
        createGLAccount("5100", "Export Sales", "Income", "Revenue"),
        createGLAccount("5110", "Domestic Sales", "Income", "Revenue"),
        createGLAccount("5120", "Scrap Sales", "Income", "Revenue"),
        createGLAccount("5130", "Other Income", "Income", "Revenue"),

        // Direct Expenses
        createGLAccount(
          "6100",
          "Raw Material Cost",
          "Expense",
          "Direct Expenses"
        ),
        createGLAccount(
          "6110",
          "Processing Cost",
          "Expense",
          "Direct Expenses"
        ),
        createGLAccount("6120", "Labor Cost", "Expense", "Direct Expenses"),
        createGLAccount("6130", "Packaging Cost", "Expense", "Direct Expenses"),

        // Indirect Expenses
        createGLAccount("6200", "Salaries", "Expense", "Indirect Expenses"),
        createGLAccount("6210", "Utilities", "Expense", "Indirect Expenses"),
        createGLAccount("6220", "Maintenance", "Expense", "Indirect Expenses"),
        createGLAccount(
          "6230",
          "Administrative Expenses",
          "Expense",
          "Indirect Expenses"
        ),
        createGLAccount(
          "6240",
          "Marketing Expenses",
          "Expense",
          "Indirect Expenses"
        ),

        // Finance Costs
        createGLAccount("6300", "Bank Charges", "Expense", "Finance Costs"),
        createGLAccount("6310", "Forex Loss", "Expense", "Finance Costs"),
        createGLAccount("6320", "Interest Expense", "Expense", "Finance Costs"),
      ];

      await queryInterface.bulkInsert("gl_account_master", glAccounts, {});
      console.log(`Inserted ${glAccounts.length} GL account records`);
    } else {
      console.log(
        `GL accounts already exist (${existingGLCount[0].count} records), skipping...`
      );
    }

    // ============================================================================
    // PHASE 2: SEED GST MASTER DATA
    // ============================================================================

    console.log("Seeding GST Master Data...");

    // Check if GST data already exists
    const existingGSTCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM gst_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingGSTCount[0].count === 0) {
      const gstData = [
        // Seafood GST rates
        {
          id: uuidv4(),
          hsn_code: "0302",
          description:
            "Fish and crustaceans, molluscs and other aquatic invertebrates",
          gst_rate: 5.0,
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          hsn_code: "0303",
          description:
            "Fish, frozen, excluding fish fillets and other fish meat",
          gst_rate: 5.0,
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          hsn_code: "0304",
          description:
            "Fish fillets and other fish meat (whether or not minced)",
          gst_rate: 5.0,
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          hsn_code: "0306",
          description:
            "Crustaceans, whether in shell or not, live, fresh, chilled, frozen, dried, salted or in brine",
          gst_rate: 5.0,
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          hsn_code: "0307",
          description:
            "Molluscs, whether in shell or not, live, fresh, chilled, frozen, dried, salted or in brine",
          gst_rate: 5.0,
          cgst_rate: 2.5,
          sgst_rate: 2.5,
          igst_rate: 5.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
        // Additional GST rates for other items
        {
          id: uuidv4(),
          hsn_code: "3923",
          description: "Packaging materials - Plastic bags and pouches",
          gst_rate: 18.0,
          cgst_rate: 9.0,
          sgst_rate: 9.0,
          igst_rate: 18.0,
          cess_rate: 0.0,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        },
      ];

      await queryInterface.bulkInsert("gst_master", gstData, {});
      console.log(`Inserted ${gstData.length} GST master records`);
    } else {
      console.log(
        `GST master data already exists (${existingGSTCount[0].count} records), skipping...`
      );
    }

    // ============================================================================
    // PHASE 3: SEED COST MASTER DATA
    // ============================================================================

    console.log("Seeding Cost Master Data...");

    // Get packaging records for cost mapping
    const packagingRecords = await queryInterface.sequelize.query(
      "SELECT id, packaging_code, packaging_type FROM packaging_master WHERE is_active = true",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (packagingRecords.length > 0) {
      const costData = [];

      packagingRecords.forEach((packaging) => {
        let costPerUnit = 0;
        let costUom = "PCS";

        switch (packaging.packaging_type) {
          case "VACUUM_POUCH":
            costPerUnit = 2.5;
            break;
          case "IQF_BAG":
            costPerUnit = 3.75;
            break;
          case "TRAY":
            costPerUnit = 1.25;
            break;
          case "BOX":
            costPerUnit = 5.0;
            break;
          case "MC":
            costPerUnit = 25.0;
            break;
          case "PALLET":
            costPerUnit = 150.0;
            break;
          default:
            costPerUnit = 1.0;
        }

        costData.push({
          id: uuidv4(),
          packaging_master_id: packaging.id,
          cost_per_unit: costPerUnit,
          cost_uom: costUom,
          effective_from: now,
          is_active: true,
          created_by: systemUserId,
          updated_by: systemUserId,
          created_at: now,
          updated_at: now,
        });
      });

      // Check for existing cost data
      const existingCostCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM packaging_cost_master",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingCostCount[0].count === 0) {
        await queryInterface.bulkInsert("packaging_cost_master", costData, {});
        console.log(`Inserted ${costData.length} packaging cost records`);
      } else {
        console.log(`Packaging cost data already exists, skipping...`);
      }
    }

    // ============================================================================
    // PHASE 4: SEED PROCESSING COST MASTER
    // ============================================================================

    console.log("Seeding Processing Cost Master...");

    const processingCostData = [
      {
        id: uuidv4(),
        process_type: "PEELING",
        cost_per_kg: 15.0,
        cost_uom: "KG",
        description: "Peeling and cleaning cost per kg",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        process_type: "PACKING",
        cost_per_kg: 8.0,
        cost_uom: "KG",
        description: "Packing and packaging cost per kg",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        process_type: "IQF_FREEZING",
        cost_per_kg: 12.0,
        cost_uom: "KG",
        description: "IQF freezing cost per kg",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingProcessingCostCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM processing_cost_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingProcessingCostCount[0].count === 0) {
      await queryInterface.bulkInsert(
        "processing_cost_master",
        processingCostData,
        {}
      );
      console.log(
        `Inserted ${processingCostData.length} processing cost records`
      );
    } else {
      console.log(`Processing cost data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 5: SEED MARGIN MASTER
    // ============================================================================

    console.log("Seeding Margin Master...");

    const marginData = [
      {
        id: uuidv4(),
        margin_type: "EXPORT",
        margin_percentage: 25.0,
        description: "Export margin percentage",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        margin_type: "DOMESTIC",
        margin_percentage: 20.0,
        description: "Domestic margin percentage",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        margin_type: "VALUE_ADDED",
        margin_percentage: 35.0,
        description: "Value added products margin percentage",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingMarginCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM margin_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingMarginCount[0].count === 0) {
      await queryInterface.bulkInsert("margin_master", marginData, {});
      console.log(`Inserted ${marginData.length} margin master records`);
    } else {
      console.log(`Margin master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 6: SEED YIELD REASON MASTER
    // ============================================================================

    console.log("Seeding Yield Reason Master...");

    const yieldReasonData = [
      {
        id: uuidv4(),
        reason_code: "PROCESS_LOSS",
        reason_description: "Processing loss during peeling/cleaning",
        yield_percentage: 15.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        reason_code: "QUALITY_REJECTION",
        reason_description: "Quality rejection during inspection",
        yield_percentage: 5.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        reason_code: "PACKAGING_WASTE",
        reason_description: "Packaging material waste",
        yield_percentage: 2.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingYieldReasonCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM yield_reason_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingYieldReasonCount[0].count === 0) {
      await queryInterface.bulkInsert(
        "yield_reason_master",
        yieldReasonData,
        {}
      );
      console.log(`Inserted ${yieldReasonData.length} yield reason records`);
    } else {
      console.log(`Yield reason data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 7: SEED POSTING RULES
    // ============================================================================

    console.log("Seeding Posting Rules...");

    const postingRulesData = [
      {
        id: uuidv4(),
        transaction_type: "PURCHASE",
        debit_account: "1600", // Raw Seafood Inventory
        credit_account: "3100", // Accounts Payable
        description: "Purchase transaction posting rule",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_type: "SALES",
        debit_account: "1200", // Accounts Receivable
        credit_account: "5100", // Export Sales
        description: "Sales transaction posting rule",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        transaction_type: "GST_INPUT",
        debit_account: "1501", // CGST Input
        credit_account: "3100", // Accounts Payable
        description: "GST input posting rule",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingPostingRulesCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM posting_rules",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPostingRulesCount[0].count === 0) {
      await queryInterface.bulkInsert("posting_rules", postingRulesData, {});
      console.log(`Inserted ${postingRulesData.length} posting rules`);
    } else {
      console.log(`Posting rules already exist, skipping...`);
    }

    console.log(
      "Consolidated accounting & financial master seeding completed successfully"
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove in reverse order
    await queryInterface.bulkDelete(
      "posting_rules",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "yield_reason_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "margin_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "processing_cost_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "packaging_cost_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "gst_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "gl_account_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );
  },
};
