import models, { sequelize } from "../../../models";

/**
 * Create Journal Entry with lines
 * Entry structure: {
 *   entry_date, reference_type, reference_id, description,
 *   lines: [{account_id, debit, credit, line_description}, ...]
 * }
 */
export const CreateJournalEntry = (
  { profile_id, ...params },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        entry_date,
        reference_type,
        reference_id,
        description,
        lines = [],
      } = params;

      // Validate total debit = total credit
      const totalDebit = lines.reduce(
        (sum, line) => sum + (parseFloat(line.debit) || 0),
        0,
      );
      const totalCredit = lines.reduce(
        (sum, line) => sum + (parseFloat(line.credit) || 0),
        0,
      );

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error("Total debits must equal total credits");
      }

      // Create journal entry
      const journalEntry = await models.journal_entry.create(
        {
          entry_date: entry_date || new Date(),
          reference_type,
          reference_id,
          description,
          total_debit: totalDebit,
          total_credit: totalCredit,
          currency: "INR",
          is_posted: false,
        },
        { profile_id, transaction },
      );

      // Create journal lines
      for (const line of lines) {
        await models.journal_line.create(
          {
            journal_entry_id: journalEntry.id,
            account_id: line.account_id,
            debit: line.debit || 0,
            credit: line.credit || 0,
            currency: "INR",
            line_description: line.line_description,
          },
          { profile_id, transaction },
        );
      }

      // Create audit trail
      await models.accounting_audit_trail.create(
        {
          journal_entry_id: journalEntry.id,
          module: reference_type,
          action: "CREATE",
          reference_id,
          reference_type,
          description: `Created journal entry ${journalEntry.entry_number}`,
          new_values: { entry_id: journalEntry.id, lines_count: lines.length },
        },
        { profile_id, transaction },
      );

      await transaction.commit();

      resolve({
        statusCode: 201,
        message: "Journal entry created successfully",
        data: {
          id: journalEntry.id,
          entry_number: journalEntry.entry_number,
          total_debit: journalEntry.total_debit,
          total_credit: journalEntry.total_credit,
        },
      });
    } catch (err) {
      await transaction.rollback();
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Post Journal Entry (make it immutable)
 */
export const PostJournalEntry = (
  { profile_id, journal_entry_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    const transaction = await sequelize.transaction();
    try {
      const entry = await models.journal_entry.findByPk(journal_entry_id, {
        transaction,
      });

      if (!entry) throw new Error("Journal entry not found");
      if (entry.is_posted) throw new Error("Journal entry is already posted");

      // Post the entry
      entry.is_posted = true;
      entry.posted_at = new Date();
      entry.posted_by = profile_id;
      await entry.save({ transaction });

      // Create audit trail
      await models.accounting_audit_trail.create(
        {
          journal_entry_id: entry.id,
          module: entry.reference_type,
          action: "POST",
          reference_id: entry.reference_id,
          description: `Posted journal entry ${entry.entry_number}`,
        },
        { profile_id, transaction },
      );

      await transaction.commit();

      resolve({
        statusCode: 200,
        message: "Journal entry posted successfully",
        data: {
          id: entry.id,
          entry_number: entry.entry_number,
          is_posted: true,
        },
      });
    } catch (err) {
      await transaction.rollback();
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Reverse Journal Entry (create reversal entry)
 */
export const ReverseJournalEntry = (
  { profile_id, journal_entry_id, reason },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    const transaction = await sequelize.transaction();
    try {
      const originalEntry = await models.journal_entry.findByPk(
        journal_entry_id,
        {
          include: [{ as: "lines", association: "lines" }],
          transaction,
        },
      );

      if (!originalEntry) throw new Error("Journal entry not found");
      if (!originalEntry.is_posted)
        throw new Error("Only posted entries can be reversed");

      // Create reversal entry (debit/credit swapped)
      const reversalLines = originalEntry.lines.map((line) => ({
        account_id: line.account_id,
        debit: line.credit,
        credit: line.debit,
        line_description: `Reversal of ${originalEntry.entry_number}`,
      }));

      const totalCredit = originalEntry.lines.reduce(
        (sum, line) => sum + (parseFloat(line.debit) || 0),
        0,
      );
      const totalDebit = originalEntry.lines.reduce(
        (sum, line) => sum + (parseFloat(line.credit) || 0),
        0,
      );

      const reversalEntry = await models.journal_entry.create(
        {
          entry_date: new Date(),
          reference_type: originalEntry.reference_type,
          reference_id: originalEntry.reference_id,
          description: `Reversal of ${originalEntry.entry_number} - Reason: ${reason}`,
          total_debit: totalDebit,
          total_credit: totalCredit,
          currency: "INR",
          is_posted: true,
          posted_at: new Date(),
          posted_by: profile_id,
        },
        { profile_id, transaction },
      );

      // Create reversal lines
      for (const line of reversalLines) {
        await models.journal_line.create(
          {
            journal_entry_id: reversalEntry.id,
            ...line,
            currency: "INR",
          },
          { profile_id, transaction },
        );
      }

      // Create audit trail
      await models.accounting_audit_trail.create(
        {
          journal_entry_id: reversalEntry.id,
          module: originalEntry.reference_type,
          action: "REVERSE",
          reference_id: originalEntry.reference_id,
          description: `Reversed journal entry ${originalEntry.entry_number}`,
          old_values: { original_entry_id: originalEntry.id },
          new_values: { reversal_entry_id: reversalEntry.id },
        },
        { profile_id, transaction },
      );

      await transaction.commit();

      resolve({
        statusCode: 201,
        message: "Journal entry reversed successfully",
        data: {
          reversal_entry_id: reversalEntry.id,
          reversal_entry_number: reversalEntry.entry_number,
          original_entry_number: originalEntry.entry_number,
        },
      });
    } catch (err) {
      await transaction.rollback();
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Get Journal Entry with all lines
 */
export const GetJournalEntry = ({ journal_entry_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const entry = await models.journal_entry.findByPk(journal_entry_id, {
        include: [
          {
            as: "lines",
            association: "lines",
            include: [
              {
                as: "account",
                association: "account",
                attributes: ["id", "account_code", "account_name"],
              },
            ],
          },
        ],
      });

      if (!entry) throw new Error("Journal entry not found");

      resolve({
        statusCode: 200,
        message: "Journal entry retrieved successfully",
        data: entry,
      });
    } catch (err) {
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Get all Journal Entries with pagination
 */
export const GetAllJournalEntries = (
  { profile_id, page = 1, limit = 50, reference_type, is_posted },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const where = { is_active: true };
      if (reference_type) where.reference_type = reference_type;
      if (is_posted !== undefined) where.is_posted = is_posted;

      const { count, rows } = await models.journal_entry.findAndCountAll({
        where,
        include: [
          {
            as: "lines",
            association: "lines",
            attributes: ["id", "account_id", "debit", "credit"],
          },
        ],
        limit,
        offset: (page - 1) * limit,
        order: [["entry_date", "DESC"]],
      });

      resolve({
        statusCode: 200,
        message: "Journal entries retrieved successfully",
        data: {
          entries: rows,
          total: count,
          pages: Math.ceil(count / limit),
          current_page: page,
        },
      });
    } catch (err) {
      reject({ statusCode: 400, message: err.message });
    }
  });
};

export default {
  CreateJournalEntry,
  PostJournalEntry,
  ReverseJournalEntry,
  GetJournalEntry,
  GetAllJournalEntries,
};
