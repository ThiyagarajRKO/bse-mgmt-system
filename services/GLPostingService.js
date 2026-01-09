"use strict";

const { v4: uuidv4 } = require("uuid");
const db = require("../models");

class GLPostingService {
  /**
   * Generate unique GL entry number in format GL-YYYYMMDD-HHMMSS-XXXX
   * @returns {string} Unique entry number
   */
  generateEntryNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(
      4,
      "0"
    );

    return `GL-${year}${month}${day}-${hours}${minutes}${seconds}-${randomSuffix}`;
  }

  /**
   * Get standard GL account codes from chart of accounts
   * @returns {Promise<Object>} Map of account purposes to codes
   */
  async getAccountCodes() {
    const accounts = await db.ChartOfAccounts.findAll({
      attributes: ["account_code", "account_name", "account_type"],
      raw: true,
    });

    // Map common accounts (this assumes standard chart of accounts structure)
    const accountMap = {
      finished_goods: null, // Asset account for FG inventory
      raw_materials: null, // Asset account for RM inventory
      accounts_receivable: null, // Asset account for AR
      sales_revenue: null, // Revenue account
      cash: null, // Asset account for cash/bank
    };

    // Try to auto-detect common accounts
    accounts.forEach((acc) => {
      const code = acc.account_code.toLowerCase();
      const name = acc.account_name.toLowerCase();

      if (
        name.includes("finished") ||
        code.includes("fini") ||
        code.startsWith("1100")
      ) {
        accountMap.finished_goods = acc.account_code;
      }
      if (
        name.includes("raw") ||
        name.includes("materials") ||
        code.includes("raw") ||
        code.startsWith("1050")
      ) {
        accountMap.raw_materials = acc.account_code;
      }
      if (
        name.includes("accounts receivable") ||
        code.includes("ar") ||
        code.startsWith("1200")
      ) {
        accountMap.accounts_receivable = acc.account_code;
      }
      if (
        name.includes("sales") ||
        code.includes("sales") ||
        code.startsWith("4000")
      ) {
        accountMap.sales_revenue = acc.account_code;
      }
      if (
        name.includes("cash") ||
        name.includes("bank") ||
        code.includes("cash") ||
        code.startsWith("1010")
      ) {
        accountMap.cash = acc.account_code;
      }
    });

    return { accounts, accountMap };
  }

  /**
   * Create GL entries for production output (Dr FG, Cr RM)
   * @param {string} productionOutputId - Production Output ID
   * @param {string} createdBy - User creating the entry
   * @returns {Promise<Array>} Created GL entries
   */
  async postProductionOutput(productionOutputId, createdBy) {
    const productionOutput = await db.ProductionOutput.findByPk(
      productionOutputId
    );

    if (!productionOutput) {
      throw new Error(`ProductionOutput not found: ${productionOutputId}`);
    }

    if (!productionOutput.inventory_posted) {
      throw new Error("Production output has not been posted to inventory");
    }

    // Check if entries already exist for this output
    const existingEntries = await db.GLPosting.findAll({
      where: {
        production_output_id: productionOutputId,
        posting_status: "POSTED",
      },
    });

    if (existingEntries.length > 0) {
      throw new Error("GL entries already posted for this production output");
    }

    const { accountMap } = await this.getAccountCodes();

    if (!accountMap.finished_goods || !accountMap.raw_materials) {
      throw new Error(
        "Required GL accounts (Finished Goods or Raw Materials) not found in chart of accounts"
      );
    }

    const costAmount = parseFloat(productionOutput.cost_allocated || 0);
    if (costAmount <= 0) {
      throw new Error("Cost allocated must be greater than 0");
    }

    const entries = [];

    // Dr FG (Debit Finished Goods)
    const fgEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.finished_goods,
      debit: costAmount,
      credit: 0,
      production_output_id: productionOutputId,
      description: `Finished goods receipt - SKU: ${productionOutput.sku_code}, Qty: ${productionOutput.final_output_quantity}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(fgEntry);

    // Cr RM (Credit Raw Materials)
    const rmEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.raw_materials,
      debit: 0,
      credit: costAmount,
      production_output_id: productionOutputId,
      description: `Raw materials consumed - SKU: ${productionOutput.sku_code}, Qty: ${productionOutput.final_output_quantity}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(rmEntry);

    return entries;
  }

  /**
   * Create GL entries for sales invoice (Dr AR, Cr Sales Revenue)
   * @param {string} invoiceId - Sales Invoice ID
   * @param {string} createdBy - User creating the entry
   * @returns {Promise<Array>} Created GL entries
   */
  async postSalesInvoice(invoiceId, createdBy) {
    const invoice = await db.SalesInvoice.findByPk(invoiceId);

    if (!invoice) {
      throw new Error(`SalesInvoice not found: ${invoiceId}`);
    }

    if (invoice.invoice_status !== "POSTED") {
      throw new Error("Invoice must be posted before GL posting");
    }

    // Check if entries already exist for this invoice
    const existingEntries = await db.GLPosting.findAll({
      where: {
        invoice_id: invoiceId,
        posting_status: "POSTED",
      },
    });

    if (existingEntries.length > 0) {
      throw new Error("GL entries already posted for this invoice");
    }

    const { accountMap } = await this.getAccountCodes();

    if (!accountMap.accounts_receivable || !accountMap.sales_revenue) {
      throw new Error("Required GL accounts (AR or Sales Revenue) not found");
    }

    const netAmount = parseFloat(invoice.net_total_amount || 0);
    if (netAmount <= 0) {
      throw new Error("Invoice net total must be greater than 0");
    }

    const entries = [];

    // Dr AR (Debit Accounts Receivable)
    const arEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.accounts_receivable,
      debit: netAmount,
      credit: 0,
      invoice_id: invoiceId,
      description: `Sales invoice - INV: ${invoice.invoice_number}, Net: ${netAmount}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(arEntry);

    // Cr Sales Revenue (Credit Sales)
    const srEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.sales_revenue,
      debit: 0,
      credit: netAmount,
      invoice_id: invoiceId,
      description: `Sales revenue - INV: ${invoice.invoice_number}, Amount: ${netAmount}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(srEntry);

    return entries;
  }

  /**
   * Create GL entries for payment (Dr Cash, Cr AR)
   * @param {string} paymentId - Sales Payment ID
   * @param {string} createdBy - User creating the entry
   * @returns {Promise<Array>} Created GL entries
   */
  async postPayment(paymentId, createdBy) {
    const payment = await db.SalesPayment.findByPk(paymentId);

    if (!payment) {
      throw new Error(`SalesPayment not found: ${paymentId}`);
    }

    if (payment.payment_status !== "PAID") {
      throw new Error("Payment must be in PAID status");
    }

    // Check if entries already exist for this payment
    const existingEntries = await db.GLPosting.findAll({
      where: {
        payment_id: paymentId,
        posting_status: "POSTED",
      },
    });

    if (existingEntries.length > 0) {
      throw new Error("GL entries already posted for this payment");
    }

    const { accountMap } = await this.getAccountCodes();

    if (!accountMap.cash || !accountMap.accounts_receivable) {
      throw new Error("Required GL accounts (Cash or AR) not found");
    }

    const paidAmount = parseFloat(payment.paid_amount || 0);
    if (paidAmount <= 0) {
      throw new Error("Paid amount must be greater than 0");
    }

    const entries = [];

    // Dr Cash (Debit Cash/Bank)
    const cashEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.cash,
      debit: paidAmount,
      credit: 0,
      payment_id: paymentId,
      description: `Cash receipt - Order: ${payment.order_id}, Amount: ${paidAmount}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(cashEntry);

    // Cr AR (Credit Accounts Receivable)
    const arEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: accountMap.accounts_receivable,
      debit: 0,
      credit: paidAmount,
      payment_id: paymentId,
      description: `AR clearance - Order: ${payment.order_id}, Amount: ${paidAmount}`,
      posting_status: "POSTED",
      posted_by: createdBy,
      posted_at: new Date(),
    });

    entries.push(arEntry);

    return entries;
  }

  /**
   * List GL entries with filters and pagination
   * @param {Object} filters - { account_code, posting_status, from_date, to_date }
   * @param {number} limit - Results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} List of GL entries
   */
  async listEntries(filters = {}, limit = 50, offset = 0) {
    const where = {};

    if (filters.account_code) where.account_code = filters.account_code;
    if (filters.posting_status) where.posting_status = filters.posting_status;

    if (filters.from_date || filters.to_date) {
      where.posting_date = {};
      if (filters.from_date) {
        where.posting_date[db.Sequelize.Op.gte] = new Date(filters.from_date);
      }
      if (filters.to_date) {
        where.posting_date[db.Sequelize.Op.lte] = new Date(filters.to_date);
      }
    }

    const entries = await db.GLPosting.findAll({
      where,
      include: [
        {
          model: db.ChartOfAccounts,
          as: "account",
          attributes: ["account_code", "account_name"],
        },
      ],
      limit,
      offset,
      order: [["posting_date", "DESC"]],
    });

    return entries;
  }

  /**
   * Get account balance
   * @param {string} accountCode - GL Account Code
   * @param {Date} asOfDate - Balance as of date
   * @returns {Promise<Object>} Account balance summary
   */
  async getAccountBalance(accountCode, asOfDate) {
    const entries = await db.GLPosting.findAll({
      where: {
        account_code: accountCode,
        posting_status: "POSTED",
        posting_date: {
          [db.Sequelize.Op.lte]: asOfDate || new Date(),
        },
      },
      raw: true,
    });

    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach((entry) => {
      totalDebit += parseFloat(entry.debit || 0);
      totalCredit += parseFloat(entry.credit || 0);
    });

    const balance = totalDebit - totalCredit;

    return {
      account_code: accountCode,
      as_of_date: asOfDate || new Date(),
      total_debit: totalDebit,
      total_credit: totalCredit,
      balance: balance,
      entry_count: entries.length,
    };
  }

  /**
   * Get trial balance (balance of all accounts)
   * @param {Date} asOfDate - Balance as of date
   * @returns {Promise<Object>} Trial balance summary
   */
  async getTrialBalance(asOfDate) {
    const entries = await db.GLPosting.findAll({
      where: {
        posting_status: "POSTED",
        posting_date: {
          [db.Sequelize.Op.lte]: asOfDate || new Date(),
        },
      },
      include: [
        {
          model: db.ChartOfAccounts,
          as: "account",
          attributes: ["account_code", "account_name", "account_type"],
        },
      ],
      raw: true,
      subQuery: false,
    });

    const accountBalances = {};
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach((entry) => {
      const code = entry.account_code;
      if (!accountBalances[code]) {
        accountBalances[code] = {
          account_code: code,
          account_name: entry["account.account_name"],
          account_type: entry["account.account_type"],
          debit: 0,
          credit: 0,
        };
      }

      accountBalances[code].debit += parseFloat(entry.debit || 0);
      accountBalances[code].credit += parseFloat(entry.credit || 0);
      totalDebit += parseFloat(entry.debit || 0);
      totalCredit += parseFloat(entry.credit || 0);
    });

    return {
      as_of_date: asOfDate || new Date(),
      accounts: Object.values(accountBalances),
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  /**
   * Reverse a GL posting (create reversal entry)
   * @param {string} entryId - Original entry ID
   * @param {string} reversalReason - Reason for reversal
   * @param {string} reversed_by - User performing reversal
   * @returns {Promise<Object>} Reversal entry
   */
  async reverseEntry(entryId, reversalReason, reversed_by) {
    const originalEntry = await db.GLPosting.findByPk(entryId);

    if (!originalEntry) {
      throw new Error(`GL entry not found: ${entryId}`);
    }

    if (originalEntry.posting_status === "REVERSED") {
      throw new Error("Entry is already reversed");
    }

    // Create reversal entry (opposite of original)
    const reversalEntry = await db.GLPosting.create({
      id: uuidv4(),
      entry_number: this.generateEntryNumber(),
      posting_date: new Date(),
      account_code: originalEntry.account_code,
      debit: originalEntry.credit, // Swap debit and credit
      credit: originalEntry.debit,
      production_output_id: originalEntry.production_output_id,
      invoice_id: originalEntry.invoice_id,
      payment_id: originalEntry.payment_id,
      description: `REVERSAL of ${originalEntry.entry_number}: ${reversalReason}`,
      posting_status: "POSTED",
      posted_by: reversed_by,
      posted_at: new Date(),
    });

    // Mark original entry as reversed
    originalEntry.posting_status = "REVERSED";
    originalEntry.reversal_entry_id = reversalEntry.id;
    await originalEntry.save();

    return reversalEntry;
  }
}

module.exports = new GLPostingService();
