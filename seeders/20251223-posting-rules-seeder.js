"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert standard posting rules for seafood ERP
    await queryInterface.bulkInsert(
      "posting_rule_master",
      [
        // Sales Invoice Posting Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          rule_code: "SALES_INVOICE",
          rule_name: "Sales Invoice - Revenue Recognition",
          event_code: "SALES_INVOICE",
          module: "SALES",
          description:
            "Posting rule for sales invoice revenue recognition and receivables",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "110100", // Accounts Receivable
              amount_field: "invoiceAmount",
              business_partner_field: "customerId",
              business_partner_code_field: "customerCode",
              business_partner_name_field: "customerName",
              text: "Sales Invoice",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "400100", // Sales Revenue
              amount_field: "invoiceAmount",
              text: "Sales Revenue",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 10,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440002",
          rule_code: "SALES_INVOICE_GST",
          rule_name: "Sales Invoice - GST Posting",
          event_code: "SALES_INVOICE",
          module: "GST",
          description: "Posting rule for sales invoice GST collection",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "110100", // Accounts Receivable
              amount_field: "gstAmount",
              business_partner_field: "customerId",
              business_partner_code_field: "customerCode",
              business_partner_name_field: "customerName",
              text: "GST on Sales",
            },
          ],
          credit_account_mappings: [
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "220501", // CGST Output 5%
                  12: "220502", // CGST Output 12%
                  18: "220503", // CGST Output 18%
                  28: "220504", // CGST Output 28%
                },
                default_account: "220500",
              },
              amount_field: "cgstAmount",
              text: "CGST Output",
            },
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "220511", // SGST Output 5%
                  12: "220512", // SGST Output 12%
                  18: "220513", // SGST Output 18%
                  28: "220514", // SGST Output 28%
                },
                default_account: "220510",
              },
              amount_field: "sgstAmount",
              text: "SGST Output",
            },
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "220521", // IGST Output 5%
                  12: "220522", // IGST Output 12%
                  18: "220523", // IGST Output 18%
                  28: "220524", // IGST Output 28%
                },
                default_account: "220520",
              },
              amount_field: "igstAmount",
              text: "IGST Output",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 11,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Purchase Invoice Posting Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440003",
          rule_code: "PURCHASE_INVOICE",
          rule_name: "Purchase Invoice - Inventory & Payables",
          event_code: "PURCHASE_INVOICE",
          module: "PURCHASE",
          description:
            "Posting rule for purchase invoice inventory valuation and payables",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "120100", // Inventory
              amount_field: "inventoryAmount",
              text: "Inventory Purchase",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "210100", // Accounts Payable
              amount_field: "invoiceAmount",
              business_partner_field: "supplierId",
              business_partner_code_field: "supplierCode",
              business_partner_name_field: "supplierName",
              text: "Purchase Invoice",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 20,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440004",
          rule_code: "PURCHASE_INVOICE_GST",
          rule_name: "Purchase Invoice - GST Posting",
          event_code: "PURCHASE_INVOICE",
          module: "GST",
          description: "Posting rule for purchase invoice GST payment",
          conditions: null,
          debit_account_mappings: [
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "120501", // CGST Input 5%
                  12: "120502", // CGST Input 12%
                  18: "120503", // CGST Input 18%
                  28: "120504", // CGST Input 28%
                },
                default_account: "120500",
              },
              amount_field: "cgstAmount",
              text: "CGST Input",
            },
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "120511", // SGST Input 5%
                  12: "120512", // SGST Input 12%
                  18: "120513", // SGST Input 18%
                  28: "120514", // SGST Input 28%
                },
                default_account: "120510",
              },
              amount_field: "sgstAmount",
              text: "SGST Input",
            },
            {
              account_rule: {
                type: "gst_based",
                gst_mapping: {
                  5: "120521", // IGST Input 5%
                  12: "120522", // IGST Input 12%
                  18: "120523", // IGST Input 18%
                  28: "120524", // IGST Input 28%
                },
                default_account: "120520",
              },
              amount_field: "igstAmount",
              text: "IGST Input",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "210100", // Accounts Payable
              amount_field: "gstAmount",
              business_partner_field: "supplierId",
              business_partner_code_field: "supplierCode",
              business_partner_name_field: "supplierName",
              text: "GST on Purchase",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 21,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Inventory Movement Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440005",
          rule_code: "GRN_RECEIPT",
          rule_name: "Goods Receipt Note - Inventory Receipt",
          event_code: "GRN",
          module: "INVENTORY",
          description: "Posting rule for goods receipt into inventory",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "120100", // Inventory
              amount_field: "inventoryAmount",
              text: "Inventory Receipt",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "500100", // GR/IR Clearing
              amount_field: "inventoryAmount",
              business_partner_field: "supplierId",
              business_partner_code_field: "supplierCode",
              business_partner_name_field: "supplierName",
              text: "GR/IR Clearing",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 30,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Production Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440006",
          rule_code: "PRODUCTION_ISSUE",
          rule_name: "Production Material Issue",
          event_code: "PROD_ISSUE",
          module: "PRODUCTION",
          description: "Posting rule for raw material issue to production",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "500200", // Production Cost
              amount_field: "issueAmount",
              text: "Raw Material Issue",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "120100", // Inventory
              amount_field: "issueAmount",
              text: "Inventory Consumption",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 40,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440007",
          rule_code: "FG_RECEIPT",
          rule_name: "Finished Goods Receipt",
          event_code: "FG_RECEIPT",
          module: "PRODUCTION",
          description:
            "Posting rule for finished goods receipt from production",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "120200", // Finished Goods Inventory
              amount_field: "receiptAmount",
              text: "Finished Goods Receipt",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "500200", // Production Cost
              amount_field: "receiptAmount",
              text: "Production Cost Absorption",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 41,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Yield Loss Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440008",
          rule_code: "YIELD_LOSS_STANDARD",
          rule_name: "Yield Loss - Standard Cost Variance",
          event_code: "YIELD_LOSS",
          module: "YIELD",
          description:
            "Posting rule for yield loss variance against standard cost",
          conditions: { variance_type: "STANDARD" },
          debit_account_mappings: [
            {
              account_code: "500300", // Yield Loss Expense
              amount_field: "lossAmount",
              text: "Yield Loss - Standard Variance",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "120100", // Inventory
              amount_field: "lossAmount",
              text: "Inventory Adjustment - Yield Loss",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 50,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440009",
          rule_code: "YIELD_LOSS_ACTUAL",
          rule_name: "Yield Loss - Actual Cost Variance",
          event_code: "YIELD_LOSS",
          module: "YIELD",
          description:
            "Posting rule for yield loss variance against actual cost",
          conditions: { variance_type: "ACTUAL" },
          debit_account_mappings: [
            {
              account_code: "500310", // Yield Loss Expense - Actual
              amount_field: "lossAmount",
              text: "Yield Loss - Actual Variance",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "120100", // Inventory
              amount_field: "lossAmount",
              text: "Inventory Adjustment - Yield Loss",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 51,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Payment Rules
        {
          id: "550e8400-e29b-41d4-a716-446655440010",
          rule_code: "CUSTOMER_PAYMENT",
          rule_name: "Customer Payment Receipt",
          event_code: "CUSTOMER_PAYMENT",
          module: "SALES",
          description: "Posting rule for customer payment receipt",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "110200", // Cash/Bank
              amount_field: "paymentAmount",
              text: "Customer Payment",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "110100", // Accounts Receivable
              amount_field: "paymentAmount",
              business_partner_field: "customerId",
              business_partner_code_field: "customerCode",
              business_partner_name_field: "customerName",
              text: "Payment against Invoice",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 60,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          rule_code: "SUPPLIER_PAYMENT",
          rule_name: "Supplier Payment",
          event_code: "SUPPLIER_PAYMENT",
          module: "PURCHASE",
          description: "Posting rule for supplier payment",
          conditions: null,
          debit_account_mappings: [
            {
              account_code: "210100", // Accounts Payable
              amount_field: "paymentAmount",
              business_partner_field: "supplierId",
              business_partner_code_field: "supplierCode",
              business_partner_name_field: "supplierName",
              text: "Payment to Supplier",
            },
          ],
          credit_account_mappings: [
            {
              account_code: "110200", // Cash/Bank
              amount_field: "paymentAmount",
              text: "Supplier Payment",
            },
          ],
          posting_logic: null,
          is_active: true,
          priority: 61,
          effective_from: null,
          effective_to: null,
          created_by: null,
          updated_by: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("posting_rule_master", null, {});
  },
};
