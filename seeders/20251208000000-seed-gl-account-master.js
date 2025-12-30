"use strict";

/**
 * Consolidated GL Account Master Seeder
 *
 * This seeder consolidates all GL (General Ledger) account master data into a single,
 * comprehensive chart of accounts. It includes:
 *
 * 1. Current Assets: Cash, Bank accounts, AR, Advances, Prepaid expenses
 * 2. GST Input Accounts: CGST, SGST, IGST input assets
 * 3. Inventory: Raw seafood, value-added, packaging, finished goods
 * 4. Fixed Assets: Machinery, equipment, vehicles, accumulated depreciation
 * 5. Current Liabilities: AP, wages, TDS, vendor advances
 * 6. GST Output Accounts: CGST, SGST, IGST output liabilities
 * 7. Long-term Liabilities: Bank loans, working capital, overdraft
 * 8. Equity: Share capital, retained earnings, current year P&L
 * 9. Revenue: Export/domestic sales, scrap sales, other income
 * 10. Direct Expenses: Raw material, processing, labor, packaging
 * 11. Indirect Expenses: Salaries, utilities, maintenance, admin, marketing
 * 12. Finance Costs: Bank charges, forex, interest
 * 13. Tax & Adjustments: RCM, GST rounding, provisions
 *
 * Total: 80+ GL accounts covering complete chart of accounts
 *
 * Account Structure:
 * - Assets: 1000-2000
 * - Liabilities: 3000-3500
 * - Equity: 4000-4300
 * - Revenue: 5000-5700
 * - Expenses: 6000-8400
 */

const { v4: uuidv4 } = require("uuid");

/**
 * Helper function to create GL account rows
 * Reduces repetitive code and ensures consistent structure
 *
 * @param {string} code - Account code (e.g., "1100")
 * @param {string} name - Account name
 * @param {string} type - Account type: Asset|Liability|Equity|Income|Expense
 * @param {string} group - Account group/category
 * @param {object} opts - Optional fields: parent, is_posting, is_tax, gst_component
 * @returns {object} GL account row object
 */
function row(code, name, type, group, opts = {}) {
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
    created_at: new Date(),
    updated_at: new Date(),
  };
}

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "\n╔═════════════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║           SEEDER: GL Account Master (Consolidated)                     ║"
    );
    console.log(
      "╚═════════════════════════════════════════════════════════════════════════╝\n"
    );

    try {
      // Check if data already exists
      const existingCount = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM gl_account_master",
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (existingCount[0].count > 0) {
        console.log(
          "⚠️  GL Account Master already populated. Skipping seeding.\n"
        );
        console.log(
          `   Existing accounts: ${existingCount[0].count.toLocaleString()}\n`
        );
        return;
      }

      console.log("📚 Building GL Account Master Chart of Accounts...\n");

      const data = [
        // ═══════════════════════════════════════════════════════════════
        // 🔹 CURRENT ASSETS (1000-1400)
        // ═══════════════════════════════════════════════════════════════

        row("1100", "Cash on Hand", "Asset", "Current Assets"),
        row("1110", "Bank – INR", "Asset", "Current Assets"),
        row("1111", "Bank – USD", "Asset", "Current Assets"),
        row("1200", "Accounts Receivable", "Asset", "Trade Receivables"),
        row("1201", "Export Receivables", "Asset", "Trade Receivables"),
        row("1250", "Advance to Suppliers", "Asset", "Advances"),
        row("1350", "Prepaid Expenses", "Asset", "Prepaid"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 GST INPUT ASSETS (1300-1302)
        // ═══════════════════════════════════════════════════════════════

        row("1300", "GST Input CGST", "Asset", "GST Input", {
          is_tax: true,
          gst_component: "CGST",
        }),
        row("1301", "GST Input SGST", "Asset", "GST Input", {
          is_tax: true,
          gst_component: "SGST",
        }),
        row("1302", "GST Input IGST", "Asset", "GST Input", {
          is_tax: true,
          gst_component: "IGST",
        }),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 INVENTORY (1400-1450)
        // ═══════════════════════════════════════════════════════════════

        row("1400", "Raw Seafood Inventory", "Asset", "Inventory"),
        row("1405", "Value-Added Seafood Inventory", "Asset", "Inventory"),
        row("1410", "Packaging Material Inventory", "Asset", "Inventory"),
        row("1415", "Chemicals & Consumables", "Asset", "Inventory"),
        row("1420", "Finished Goods Inventory", "Asset", "Inventory"),
        row("1450", "Inventory In Transit", "Asset", "Inventory"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 FIXED ASSETS (2100-2200)
        // ═══════════════════════════════════════════════════════════════

        row("2100", "Machinery & Equipment", "Asset", "Fixed Assets"),
        row("2110", "Freezers & Cold Storage", "Asset", "Fixed Assets"),
        row("2120", "Factory Equipment", "Asset", "Fixed Assets"),
        row("2150", "Office Furniture & Fixtures", "Asset", "Fixed Assets"),
        row("2180", "Vehicles", "Asset", "Fixed Assets"),
        row("2200", "Accumulated Depreciation", "Asset", "Fixed Assets", {
          is_posting: true,
        }),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 CURRENT LIABILITIES (3100-3300)
        // ═══════════════════════════════════════════════════════════════

        row("3100", "Accounts Payable", "Liability", "Current Liabilities"),
        row("3200", "Wages Payable", "Liability", "Current Liabilities"),
        row("3250", "TDS Payable", "Liability", "Current Liabilities"),
        row(
          "3300",
          "Vendor Advances Received",
          "Liability",
          "Current Liabilities"
        ),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 GST OUTPUT LIABILITIES (3150-3152)
        // ═══════════════════════════════════════════════════════════════

        row("3150", "GST Output CGST", "Liability", "GST Output", {
          is_tax: true,
          gst_component: "CGST",
        }),
        row("3151", "GST Output SGST", "Liability", "GST Output", {
          is_tax: true,
          gst_component: "SGST",
        }),
        row("3152", "GST Output IGST", "Liability", "GST Output", {
          is_tax: true,
          gst_component: "IGST",
        }),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 LONG-TERM LIABILITIES (3500-3520)
        // ═══════════════════════════════════════════════════════════════

        row("3500", "Bank Loan", "Liability", "Long-term Liabilities"),
        row(
          "3510",
          "Working Capital Loan",
          "Liability",
          "Long-term Liabilities"
        ),
        row("3520", "Overdraft Account", "Liability", "Long-term Liabilities"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 EQUITY (4100-4300)
        // ═══════════════════════════════════════════════════════════════

        row("4100", "Share Capital", "Equity", "Equity"),
        row("4200", "Retained Earnings", "Equity", "Equity"),
        row("4300", "Current Year Profit/Loss", "Equity", "Equity"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 REVENUE – SALES (5100-5200)
        // ═══════════════════════════════════════════════════════════════

        row("5100", "Export Sales – Raw Seafood", "Income", "Sales"),
        row("5110", "Export Sales – Value Added", "Income", "Sales"),
        row("5120", "Domestic Sales – Seafood", "Income", "Sales"),
        row("5130", "Domestic Sales – Value Added", "Income", "Sales"),
        row("5200", "Scrap Sales", "Income", "Sales"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 OTHER INCOME (5500-5700)
        // ═══════════════════════════════════════════════════════════════

        row("5500", "Interest Income", "Income", "Other Income"),
        row("5600", "Forex Gain", "Income", "Other Income"),
        row("5700", "Other Misc. Income", "Income", "Other Income"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 DIRECT EXPENSES / COGS (6100-6195)
        // ═══════════════════════════════════════════════════════════════

        row("6100", "Raw Seafood Purchase", "Expense", "COGS"),
        row("6150", "Processing Charges", "Expense", "COGS"),
        row("6160", "Freezing Charges", "Expense", "COGS"),
        row("6170", "Cold Storage Charges", "Expense", "COGS"),
        row("6180", "Factory Labor Wages", "Expense", "COGS"),
        row("6190", "Packing Material Consumption", "Expense", "COGS"),
        row("6195", "Chemicals & Consumables Expense", "Expense", "COGS"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 INDIRECT EXPENSES / OVERHEADS (6300-6700)
        // ═══════════════════════════════════════════════════════════════

        row("6300", "Salaries", "Expense", "Overheads"),
        row("6310", "Electricity", "Expense", "Overheads"),
        row("6320", "Water Charges", "Expense", "Overheads"),
        row("6330", "Repair & Maintenance", "Expense", "Overheads"),
        row("6400", "Administrative Expenses", "Expense", "Overheads"),
        row("6500", "Marketing Expenses", "Expense", "Overheads"),
        row("6600", "Office Supplies & Stationery", "Expense", "Overheads"),
        row("6700", "Telephone & Internet", "Expense", "Overheads"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 FINANCE COSTS (6900-6920)
        // ═══════════════════════════════════════════════════════════════

        row("6900", "Bank Charges", "Expense", "Finance Costs"),
        row("6910", "Forex Loss", "Expense", "Finance Costs"),
        row("6920", "Interest Expense", "Expense", "Finance Costs"),

        // ═══════════════════════════════════════════════════════════════
        // 🔹 TAX & ADJUSTMENTS (8100-8400)
        // ═══════════════════════════════════════════════════════════════

        row("8100", "RCM Liability Ledger", "Liability", "GST-Other"),
        row("8200", "GST Rounding Adjustment", "Income", "GST-Other"),
        row("8300", "Bad Debt Expense", "Expense", "Provisions"),
        row("8400", "Provisions Account", "Liability", "Provisions"),
      ];

      console.log(`   Creating ${data.length} GL accounts...\n`);

      // Batch insert for performance
      const batchSize = 20;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));
        await queryInterface.bulkInsert("gl_account_master", batch);
        const progress = Math.min(i + batchSize, data.length);
        console.log(`   ✅ Inserted ${progress}/${data.length} accounts`);
      }

      console.log(`\n✅ Successfully seeded ${data.length} GL accounts`);
      console.log(`\n📊 Account Distribution:`);
      console.log(`   Assets (1000-2999): ~25 accounts`);
      console.log(`   Liabilities (3000-3999): ~15 accounts`);
      console.log(`   Equity (4000-4999): 3 accounts`);
      console.log(`   Revenue (5000-5999): ~8 accounts`);
      console.log(`   Expenses (6000-6999): ~28 accounts`);
      console.log(`   Tax & Adjustments (8000-8999): 4 accounts\n`);
    } catch (error) {
      console.error("❌ Error seeding GL accounts:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log(
      "\n╔═════════════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║     ROLLBACK: GL Account Master                                        ║"
    );
    console.log(
      "╚═════════════════════════════════════════════════════════════════════════╝\n"
    );

    try {
      await queryInterface.bulkDelete("gl_account_master", null, {});
      console.log("✅ Successfully rolled back GL accounts\n");
    } catch (error) {
      console.error("❌ Error rolling back GL accounts:", error.message);
      throw error;
    }
  },
};
