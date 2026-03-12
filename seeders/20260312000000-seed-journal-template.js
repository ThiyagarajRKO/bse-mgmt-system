"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, we need to get the GL accounts to get the account IDs
    // This uses the existing GL Account Master data seeded by 20251208-consolidated-accounting-financial-seeder.js

    const accountMappings = {
      "Raw Seafood Inventory": null,
      "Accounts Payable": null,
      "Bank – INR": null,
      "Value Added Inventory": null,
      "Finished Goods Inventory": null,
      "Packaging Inventory": null,
      "Processing Cost": null,
      "Raw Material Cost": null,
      "Accounts Receivable": null,
      "Domestic Sales": null,
      "CGST Output": null,
      "SGST Output": null,
      "IGST Output": null,
    };

    // Get all accounts from gl_account_master table
    // (seeded by 20251208-consolidated-accounting-financial-seeder.js)
    const accounts = await queryInterface.sequelize.query(
      `SELECT id, account_name FROM gl_account_master WHERE is_active = true`,
    );

    // Build account mapping
    accounts[0].forEach((account) => {
      if (accountMappings.hasOwnProperty(account.account_name)) {
        accountMappings[account.account_name] = account.id;
      }
    });

    // Get a system user for created_by (use the first user)
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
    );
    const systemUserId = users[0][0]?.id;

    if (!systemUserId) {
      throw new Error("No users found. Cannot seed journal templates.");
    }

    // Journal entry mapping matrix
    // Maps to existing GL accounts from 20251208-consolidated-accounting-financial-seeder.js
    const journalTemplates = [
      {
        event_type: "PURCHASE_GRN",
        event_description: "Purchase GRN - Raw Seafood received from supplier",
        debit_account_name: "Raw Seafood Inventory",
        credit_account_name: "Accounts Payable",
        auto_post: true,
      },
      {
        event_type: "SUPPLIER_PAYMENT",
        event_description: "Supplier Payment - Payment made to supplier",
        debit_account_name: "Accounts Payable",
        credit_account_name: "Bank – INR",
        auto_post: false,
      },
      {
        event_type: "RAW_ISSUE_TO_PRODUCTION",
        event_description: "Raw Material Issued to Production",
        debit_account_name: "Processing Cost",
        credit_account_name: "Raw Seafood Inventory",
        auto_post: true,
      },
      {
        event_type: "PRODUCTION_COMPLETION",
        event_description: "Production Completion - Finished goods created",
        debit_account_name: "Finished Goods Inventory",
        credit_account_name: "Value Added Inventory",
        auto_post: true,
      },
      {
        event_type: "BYPRODUCT_CREATION",
        event_description: "Byproduct Creation from Production",
        debit_account_name: "Value Added Inventory",
        credit_account_name: "Processing Cost",
        auto_post: true,
      },
      {
        event_type: "PACKAGING_CONSUMPTION",
        event_description: "Packaging Material Consumed in Production",
        debit_account_name: "Processing Cost",
        credit_account_name: "Packaging Inventory",
        auto_post: true,
      },
      {
        event_type: "PACKING_COMPLETION",
        event_description: "Packing Completion - Goods packed for dispatch",
        debit_account_name: "Finished Goods Inventory",
        credit_account_name: "Value Added Inventory",
        auto_post: true,
      },
      {
        event_type: "INTERNAL_TRANSFER",
        event_description: "Internal Inventory Transfer",
        debit_account_name: "Value Added Inventory",
        credit_account_name: "Raw Seafood Inventory",
        auto_post: true,
      },
      {
        event_type: "TRANSFER_RECEIPT",
        event_description:
          "Transfer Receipt - Inventory received at destination",
        debit_account_name: "Raw Seafood Inventory",
        credit_account_name: "Value Added Inventory",
        auto_post: true,
      },
      {
        event_type: "DISPATCH",
        event_description: "Dispatch - Goods dispatched to customer",
        debit_account_name: "Raw Material Cost",
        credit_account_name: "Finished Goods Inventory",
        auto_post: true,
      },
      {
        event_type: "SALES_INVOICE",
        event_description: "Sales Invoice - Revenue recognition",
        debit_account_name: "Accounts Receivable",
        credit_account_name: "Domestic Sales",
        auto_post: false,
      },
      {
        event_type: "SALES_TAX",
        event_description: "Sales Tax - GST on sales",
        debit_account_name: "Accounts Receivable",
        credit_account_name: "SGST Output",
        auto_post: true,
      },
      {
        event_type: "CUSTOMER_PAYMENT",
        event_description: "Customer Payment - Payment received from customer",
        debit_account_name: "Bank – INR",
        credit_account_name: "Accounts Receivable",
        auto_post: false,
      },
    ];

    // Map account names to IDs
    const templatesWithIds = journalTemplates.map((template) => ({
      id: Sequelize.literal("uuid_generate_v4()"),
      event_type: template.event_type,
      event_description: template.event_description,
      debit_account_id: accountMappings[template.debit_account_name],
      debit_account_name: template.debit_account_name,
      credit_account_id: accountMappings[template.credit_account_name],
      credit_account_name: template.credit_account_name,
      auto_post: template.auto_post,
      is_active: true,
      notes: `Auto-generated mapping for ${template.event_type}`,
      created_by: systemUserId,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Check if any accounts are missing
    const missingAccounts = templatesWithIds.filter(
      (t) => !t.debit_account_id || !t.credit_account_id,
    );

    if (missingAccounts.length > 0) {
      console.warn(
        "Warning: The following journal templates have missing account mappings:",
      );
      missingAccounts.forEach((t) => {
        console.warn(`  - ${t.event_type}`);
      });
      console.warn(
        "These templates will not be inserted. Please ensure all required accounts exist in gl_account_master.",
      );
      // Filter out templates with missing accounts
      const validTemplates = templatesWithIds.filter(
        (t) => t.debit_account_id && t.credit_account_id,
      );
      if (validTemplates.length === 0) {
        return; // Don't insert anything if all are missing
      }
      return queryInterface.bulkInsert("journal_template", validTemplates);
    }

    return queryInterface.bulkInsert("journal_template", templatesWithIds);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("journal_template", null, {});
  },
};
