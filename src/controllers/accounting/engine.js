import models, { sequelize } from "../../../models";

/**
 * Chart of Accounts mapping for automatic entry generation
 */
const ACCOUNT_CODES = {
  RAW_INVENTORY: "1100", // Raw Seafood Inventory
  WIP_INVENTORY: "1200", // Work in Progress
  FINISHED_GOODS: "1300", // Finished Goods Inventory
  PACKED_GOODS: "1350", // Packed Goods Inventory
  PACKAGING_INVENTORY: "1400", // Packaging Material Inventory
  TRANSIT_INVENTORY: "1500", // Inventory In Transit
  ACCOUNTS_RECEIVABLE: "1600", // Accounts Receivable
  BANK: "1700", // Bank / Cash
  ACCOUNTS_PAYABLE: "2100", // Accounts Payable
  GST_PAYABLE: "2200", // GST Payable
  EXPORT_DUTY: "2300", // Export Duty
  SEAFOOD_SALES: "4000", // Seafood Sales
  BYPRODUCT_SALES: "4100", // Byproduct Sales
  RAW_PURCHASE: "5000", // Raw Seafood Purchase
  PROCESSING_LABOUR: "5100", // Processing Labour
  PACKAGING_COST: "5200", // Packaging Cost
  COLD_STORAGE: "5300", // Cold Storage Cost
  FREIGHT: "5400", // Freight Expense
  QUALITY_CONTROL: "5500", // Quality Control
};

/**
 * Get Account by Code
 */
const getAccountByCode = async (code, transaction) => {
  return await ChartOfAccounts.findOne({
    where: { account_code: code, is_active: true },
    transaction,
  });
};

/**
 * Procurement Accounting: GRN received
 * Dr Raw Seafood Inventory
 * Cr Accounts Payable
 */
export const GenerateProcurementEntry = async ({ profile_id, procurement_lot_id, supplier_id, amount }, transaction) => {
  try {
    const rawInventoryAccount = await getAccountByCode(ACCOUNT_CODES.RAW_INVENTORY, transaction);
    const payableAccount = await getAccountByCode(ACCOUNT_CODES.ACCOUNTS_PAYABLE, transaction);

    if (!rawInventoryAccount || !payableAccount) throw new Error("Required accounts not found");

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "PROCUREMENT",
        reference_id: procurement_lot_id,
        description: `GRN received for procurement lot ${procurement_lot_id}`,
        total_debit: amount,
        total_credit: amount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Raw Seafood Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: rawInventoryAccount.id,
        debit: amount,
        credit: 0,
        currency: "INR",
        line_description: `Purchase of raw seafood - Lot ${procurement_lot_id}`,
      },
      { profile_id, transaction }
    );

    // Credit: Accounts Payable
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: payableAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `Payment due to supplier`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Production Accounting: Raw material issued for processing
 * Dr WIP Inventory
 * Cr Raw Seafood Inventory
 */
export const GenerateProductionEntry = async ({ profile_id, dispatch_id, amount }, transaction) => {
  try {
    const wipAccount = await getAccountByCode(ACCOUNT_CODES.WIP_INVENTORY, transaction);
    const rawAccount = await getAccountByCode(ACCOUNT_CODES.RAW_INVENTORY, transaction);

    if (!wipAccount || !rawAccount) throw new Error("Required accounts not found");

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "PRODUCTION",
        reference_id: dispatch_id,
        description: `Raw material issued for processing - Dispatch ${dispatch_id}`,
        total_debit: amount,
        total_credit: amount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: WIP Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: wipAccount.id,
        debit: amount,
        credit: 0,
        currency: "INR",
        line_description: `Raw material issued to production`,
      },
      { profile_id, transaction }
    );

    // Credit: Raw Seafood Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: rawAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `Reduction from raw inventory`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Yield Conversion Accounting
 * Dr Finished Goods Inventory
 * Cr WIP Inventory
 */
export const GenerateYieldEntry = async ({ profile_id, peeling_id, input_qty, output_qty, unit_cost }, transaction) => {
  try {
    const finishedGoodsAccount = await getAccountByCode(ACCOUNT_CODES.FINISHED_GOODS, transaction);
    const wipAccount = await getAccountByCode(ACCOUNT_CODES.WIP_INVENTORY, transaction);

    if (!finishedGoodsAccount || !wipAccount) throw new Error("Required accounts not found");

    // Calculate amounts
    const wipAmount = input_qty * unit_cost;
    const finishedGoodsAmount = output_qty * unit_cost;

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "PRODUCTION",
        reference_id: peeling_id,
        description: `Yield conversion: ${input_qty}kg input → ${output_qty}kg output`,
        total_debit: finishedGoodsAmount,
        total_credit: wipAmount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Finished Goods Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: finishedGoodsAccount.id,
        debit: finishedGoodsAmount,
        credit: 0,
        currency: "INR",
        line_description: `Finished goods (peeled product) - ${output_qty}kg`,
      },
      { profile_id, transaction }
    );

    // Credit: WIP Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: wipAccount.id,
        debit: 0,
        credit: wipAmount,
        currency: "INR",
        line_description: `Reduction from WIP - ${input_qty}kg processed`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Packing Accounting
 * Dr Packed Goods Inventory
 * Cr Finished Goods Inventory
 */
export const GeneratePackingEntry = async ({ profile_id, packing_id, quantity, unit_cost }, transaction) => {
  try {
    const packedGoodsAccount = await getAccountByCode(ACCOUNT_CODES.PACKED_GOODS, transaction);
    const finishedGoodsAccount = await getAccountByCode(ACCOUNT_CODES.FINISHED_GOODS, transaction);

    if (!packedGoodsAccount || !finishedGoodsAccount) throw new Error("Required accounts not found");

    const amount = quantity * unit_cost;

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "PACKING",
        reference_id: packing_id,
        description: `Goods packed and ready for dispatch - ${quantity}kg`,
        total_debit: amount,
        total_credit: amount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Packed Goods Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: packedGoodsAccount.id,
        debit: amount,
        credit: 0,
        currency: "INR",
        line_description: `Packed goods - ${quantity}kg`,
      },
      { profile_id, transaction }
    );

    // Credit: Finished Goods Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: finishedGoodsAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `Reduction from finished goods`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Dispatch Accounting - Internal Transfer
 * Dr Inventory In Transit
 * Cr Packed Goods Inventory
 */
export const GenerateDispatchEntry = async ({ profile_id, peeled_dispatch_id, quantity, unit_cost }, transaction) => {
  try {
    const transitAccount = await getAccountByCode(ACCOUNT_CODES.TRANSIT_INVENTORY, transaction);
    const packedGoodsAccount = await getAccountByCode(ACCOUNT_CODES.PACKED_GOODS, transaction);

    if (!transitAccount || !packedGoodsAccount) throw new Error("Required accounts not found");

    const amount = quantity * unit_cost;

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "DISPATCH",
        reference_id: peeled_dispatch_id,
        description: `Goods dispatched to customer - ${quantity}kg`,
        total_debit: amount,
        total_credit: amount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Inventory In Transit
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: transitAccount.id,
        debit: amount,
        credit: 0,
        currency: "INR",
        line_description: `Goods in transit - ${quantity}kg`,
      },
      { profile_id, transaction }
    );

    // Credit: Packed Goods Inventory
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: packedGoodsAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `Goods removed from packed inventory`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Sales Invoicing Accounting
 * Dr Accounts Receivable
 * Cr Seafood Sales
 * Cr GST Payable
 */
export const GenerateSalesEntry = async ({ profile_id, order_id, customer_id, amount, gst_amount }, transaction) => {
  try {
    const arAccount = await getAccountByCode(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, transaction);
    const salesAccount = await getAccountByCode(ACCOUNT_CODES.SEAFOOD_SALES, transaction);
    const gstAccount = await getAccountByCode(ACCOUNT_CODES.GST_PAYABLE, transaction);

    if (!arAccount || !salesAccount || !gstAccount) throw new Error("Required accounts not found");

    const totalAmount = amount + gst_amount;

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "SALES",
        reference_id: order_id,
        description: `Sales invoice - Order ${order_id}`,
        total_debit: totalAmount,
        total_credit: totalAmount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Accounts Receivable
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: arAccount.id,
        debit: totalAmount,
        credit: 0,
        currency: "INR",
        line_description: `Invoice from customer`,
      },
      { profile_id, transaction }
    );

    // Credit: Seafood Sales
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: salesAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `Sales revenue`,
      },
      { profile_id, transaction }
    );

    // Credit: GST Payable
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: gstAccount.id,
        debit: 0,
        credit: gst_amount,
        currency: "INR",
        line_description: `GST collected`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

/**
 * Customer Payment Accounting
 * Dr Bank
 * Cr Accounts Receivable
 */
export const GeneratePaymentEntry = async ({ profile_id, payment_id, customer_id, amount }, transaction) => {
  try {
    const bankAccount = await getAccountByCode(ACCOUNT_CODES.BANK, transaction);
    const arAccount = await getAccountByCode(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, transaction);

    if (!bankAccount || !arAccount) throw new Error("Required accounts not found");

    const entry = await models.journal_entry.create(
      {
        entry_date: new Date(),
        reference_type: "PAYMENT",
        reference_id: payment_id,
        description: `Customer payment received`,
        total_debit: amount,
        total_credit: amount,
        currency: "INR",
      },
      { profile_id, transaction }
    );

    // Debit: Bank
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: bankAccount.id,
        debit: amount,
        credit: 0,
        currency: "INR",
        line_description: `Payment from customer`,
      },
      { profile_id, transaction }
    );

    // Credit: Accounts Receivable
    await models.journal_line.create(
      {
        journal_entry_id: entry.id,
        account_id: arAccount.id,
        debit: 0,
        credit: amount,
        currency: "INR",
        line_description: `AR cleared`,
      },
      { profile_id, transaction }
    );

    return entry;
  } catch (err) {
    throw err;
  }
};

export default {
  GenerateProcurementEntry,
  GenerateProductionEntry,
  GenerateYieldEntry,
  GeneratePackingEntry,
  GenerateDispatchEntry,
  GenerateSalesEntry,
  GeneratePaymentEntry,
};
