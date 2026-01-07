import models from "../../models";
import { v4 as uuidv4 } from "uuid";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === "string" && UUID_PATTERN.test(id);

/**
 * Post invoice to GL
 * Creates accounting entries:
 * DR Debtors / CR Sales Revenue
 * CR GST Output Liability
 */
export const PostInvoiceToGL = async (profile_id, invoice_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { invoice_id, customer_id, total_taxable_value, total_gst } =
        invoice_data;

      if (!isValidUuid(invoice_id) || !isValidUuid(customer_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid ID format",
        });
      }

      // Get invoice details
      const invoice = await models.Invoice.findOne({
        where: { id: invoice_id, is_active: true },
      });

      if (!invoice) {
        return reject({
          statusCode: 404,
          message: "Invoice not found",
        });
      }

      // Get chart of accounts
      const debtorsAccount = await models.ChartOfAccounts.findOne({
        where: {
          account_type: "ASSET",
          account_category: "CURRENT_ASSET",
        },
        limit: 1,
      });

      const salesAccount = await models.ChartOfAccounts.findOne({
        where: {
          account_type: "REVENUE",
          account_category: "OPERATING_REVENUE",
        },
        limit: 1,
      });

      const gstAccount = await models.ChartOfAccounts.findOne({
        where: {
          account_type: "LIABILITY",
          account_category: "CURRENT_LIABILITY",
        },
        limit: 1,
      });

      if (!debtorsAccount || !salesAccount || !gstAccount) {
        return reject({
          statusCode: 400,
          message: "Required chart of accounts not configured",
        });
      }

      // Create journal header
      const journalNo = `JNL-${Date.now()}`;
      const journalHeader = await models.JournalHeader.create({
        journal_no: journalNo,
        journal_date: new Date(),
        posting_date: new Date(),
        journal_status: "DRAFT",
        created_by: profile_id,
      });

      const postingDate = new Date();
      const entries = [];

      // Entry 1: DR Debtors
      const posting1 = await models.LedgerPosting.create({
        posting_no: `POST-${uuidv4()}`,
        source_type: "INVOICE",
        source_id: invoice_id,
        journal_header_id: journalHeader.id,
        account_code: debtorsAccount.account_code,
        debit_amount: total_taxable_value + total_gst,
        credit_amount: 0,
        posting_date: postingDate,
        reference_no: invoice.invoice_no,
        description: `Debtors - Invoice ${invoice.invoice_no}`,
        posting_status: "DRAFT",
        created_by: profile_id,
      });
      entries.push(posting1);

      // Entry 2: CR Sales Revenue
      const posting2 = await models.LedgerPosting.create({
        posting_no: `POST-${uuidv4()}`,
        source_type: "INVOICE",
        source_id: invoice_id,
        journal_header_id: journalHeader.id,
        account_code: salesAccount.account_code,
        debit_amount: 0,
        credit_amount: total_taxable_value,
        posting_date: postingDate,
        reference_no: invoice.invoice_no,
        description: `Sales Revenue - Invoice ${invoice.invoice_no}`,
        posting_status: "DRAFT",
        created_by: profile_id,
      });
      entries.push(posting2);

      // Entry 3: CR GST Output Liability
      const posting3 = await models.LedgerPosting.create({
        posting_no: `POST-${uuidv4()}`,
        source_type: "INVOICE",
        source_id: invoice_id,
        journal_header_id: journalHeader.id,
        account_code: gstAccount.account_code,
        debit_amount: 0,
        credit_amount: total_gst,
        posting_date: postingDate,
        reference_no: invoice.invoice_no,
        description: `GST Output Liability - Invoice ${invoice.invoice_no}`,
        posting_status: "DRAFT",
        created_by: profile_id,
      });
      entries.push(posting3);

      // Update journal status to POSTED
      await journalHeader.update(
        { journal_status: "POSTED", updated_by: profile_id },
        { profile_id }
      );

      // Update all postings to POSTED
      for (const entry of entries) {
        await entry.update({ posting_status: "POSTED" }, { profile_id });
      }

      resolve({
        statusCode: 201,
        message: "Invoice posted to GL successfully",
        data: {
          journal_header_id: journalHeader.id,
          journal_no: journalNo,
          entries_created: entries.length,
          postings: entries,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Post COGS when goods are fulfilled
 * DR COGS / CR Inventory
 */
export const PostCOGSToGL = async (profile_id, cogs_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { dispatch_id, batch_id, cogs_amount } = cogs_data;

      if (!isValidUuid(batch_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Batch ID format",
        });
      }

      // Get COGS and Inventory accounts
      const cogsAccount = await models.ChartOfAccounts.findOne({
        where: {
          account_type: "EXPENSE",
          account_category: "COST_OF_SALES",
        },
        limit: 1,
      });

      const inventoryAccount = await models.ChartOfAccounts.findOne({
        where: {
          account_type: "ASSET",
          account_category: "CURRENT_ASSET",
        },
        limit: 1,
      });

      if (!cogsAccount || !inventoryAccount) {
        return reject({
          statusCode: 400,
          message: "Required chart of accounts not configured",
        });
      }

      const journalNo = `COGS-${Date.now()}`;
      const journalHeader = await models.JournalHeader.create({
        journal_no: journalNo,
        journal_date: new Date(),
        posting_date: new Date(),
        journal_status: "DRAFT",
        created_by: profile_id,
      });

      const postingDate = new Date();
      const entries = [];

      // Entry 1: DR COGS
      const posting1 = await models.LedgerPosting.create({
        posting_no: `POST-${uuidv4()}`,
        source_type: "DISPATCH",
        source_id: dispatch_id || null,
        journal_header_id: journalHeader.id,
        account_code: cogsAccount.account_code,
        debit_amount: cogs_amount,
        credit_amount: 0,
        posting_date: postingDate,
        reference_no: `BATCH-${batch_id}`,
        description: `COGS - Batch Fulfillment`,
        posting_status: "DRAFT",
        created_by: profile_id,
      });
      entries.push(posting1);

      // Entry 2: CR Inventory
      const posting2 = await models.LedgerPosting.create({
        posting_no: `POST-${uuidv4()}`,
        source_type: "DISPATCH",
        source_id: dispatch_id || null,
        journal_header_id: journalHeader.id,
        account_code: inventoryAccount.account_code,
        debit_amount: 0,
        credit_amount: cogs_amount,
        posting_date: postingDate,
        reference_no: `BATCH-${batch_id}`,
        description: `Inventory Reduction - Batch Fulfillment`,
        posting_status: "DRAFT",
        created_by: profile_id,
      });
      entries.push(posting2);

      // Update journal and postings to POSTED
      await journalHeader.update(
        { journal_status: "POSTED", updated_by: profile_id },
        { profile_id }
      );

      for (const entry of entries) {
        await entry.update({ posting_status: "POSTED" }, { profile_id });
      }

      resolve({
        statusCode: 201,
        message: "COGS posted to GL successfully",
        data: {
          journal_header_id: journalHeader.id,
          journal_no: journalNo,
          entries_created: entries.length,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get GL posting history for invoice/dispatch
 */
export const GetPostingHistory = async (source_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(source_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid source_id format",
        });
      }

      const postings = await models.LedgerPosting.findAll({
        where: { source_id, is_active: true },
        include: [
          {
            model: models.ChartOfAccounts,
            as: "account",
            attributes: ["account_code", "account_name", "account_type"],
          },
          {
            model: models.JournalHeader,
            attributes: ["journal_no", "journal_date", "journal_status"],
          },
        ],
        order: [["posting_date", "ASC"]],
      });

      resolve({
        statusCode: 200,
        data: postings,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  PostInvoiceToGL,
  PostCOGSToGL,
  GetPostingHistory,
};
