import models, { sequelize } from "../../../models/index.js";

/**
 * Get all journal templates
 * Used to display the Event → Journal Mapping Matrix
 */
export const GetAllJournalTemplates = async (req, res) => {
  try {
    const templates = await models.journal_template.findAll({
      where: { is_active: true },
      include: [
        {
          model: models.chart_of_accounts,
          as: "debit_account",
          attributes: ["id", "account_code", "account_name", "account_type"],
        },
        {
          model: models.chart_of_accounts,
          as: "credit_account",
          attributes: ["id", "account_code", "account_name", "account_type"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.code(200).send({
      success: true,
      data: templates,
      message: "Journal templates retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching journal templates:", error);
    return res.code(500).send({
      success: false,
      message: "Error fetching journal templates",
      error: error.message,
    });
  }
};

/**
 * Get template by event type
 * Used to fetch the mapping for a specific event
 */
export const GetJournalTemplateByEvent = async (req, res) => {
  try {
    const { event_type } = req.params;

    const template = await models.journal_template.findOne({
      where: { event_type, is_active: true },
      include: [
        {
          model: models.chart_of_accounts,
          as: "debit_account",
          attributes: ["id", "account_code", "account_name", "account_type"],
        },
        {
          model: models.chart_of_accounts,
          as: "credit_account",
          attributes: ["id", "account_code", "account_name", "account_type"],
        },
      ],
    });

    if (!template) {
      return res.code(404).send({
        success: false,
        message: `Journal template not found for event type: ${event_type}`,
      });
    }

    return res.code(200).send({
      success: true,
      data: template,
      message: "Journal template retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching journal template:", error);
    return res.code(500).send({
      success: false,
      message: "Error fetching journal template",
      error: error.message,
    });
  }
};

/**
 * Create or update a journal template
 */
export const SaveJournalTemplate = async (req, res) => {
  try {
    const {
      event_type,
      event_description,
      debit_account_id,
      credit_account_id,
      auto_post,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !event_type ||
      !event_description ||
      !debit_account_id ||
      !credit_account_id
    ) {
      return res.code(400).send({
        success: false,
        message:
          "Missing required fields: event_type, event_description, debit_account_id, credit_account_id",
      });
    }

    // Verify accounts exist
    const debitAccount =
      await models.chart_of_accounts.findByPk(debit_account_id);
    const creditAccount =
      await models.chart_of_accounts.findByPk(credit_account_id);

    if (!debitAccount || !creditAccount) {
      return res.code(400).send({
        success: false,
        message: "Invalid account IDs provided",
      });
    }

    // Check if template already exists
    let template = await models.journal_template.findOne({
      where: { event_type },
    });

    if (template) {
      // Update existing template
      await template.update({
        event_description,
        debit_account_id,
        debit_account_name: debitAccount.account_name,
        credit_account_id,
        credit_account_name: creditAccount.account_name,
        auto_post: auto_post || false,
        notes,
        updated_by: req?.session?.user_id,
      });
    } else {
      // Create new template
      template = await models.journal_template.create({
        event_type,
        event_description,
        debit_account_id,
        debit_account_name: debitAccount.account_name,
        credit_account_id,
        credit_account_name: creditAccount.account_name,
        auto_post: auto_post || false,
        notes,
        created_by: req?.session?.user_id,
      });
    }

    return res.code(201).send({
      success: true,
      data: template,
      message: "Journal template saved successfully",
    });
  } catch (error) {
    console.error("Error saving journal template:", error);
    return res.code(500).send({
      success: false,
      message: "Error saving journal template",
      error: error.message,
    });
  }
};

/**
 * Apply a journal template to create journal entry
 * This function automatically creates a journal entry using the template
 */
export const ApplyJournalTemplate = async (req, res) => {
  try {
    const { event_type, reference_type, reference_id, amount, description } =
      req.body;

    // Get the template
    const template = await models.journal_template.findOne({
      where: { event_type, is_active: true },
      include: [
        {
          model: models.chart_of_accounts,
          as: "debit_account",
        },
        {
          model: models.chart_of_accounts,
          as: "credit_account",
        },
      ],
    });

    if (!template) {
      return res.code(404).send({
        success: false,
        message: `No active template found for event type: ${event_type}`,
      });
    }

    // Create journal entry using transaction
    const transaction = await sequelize.transaction();

    try {
      // Generate entry number
      const lastEntry = await models.journal_entry.findOne({
        order: [["entry_number", "DESC"]],
        raw: true,
      });

      const entryNumber = lastEntry
        ? `JE-${parseInt(lastEntry.entry_number.split("-")[1]) + 1}`
        : "JE-1001";

      // Create journal entry
      const journalEntry = await models.journal_entry.create(
        {
          entry_number: entryNumber,
          entry_date: new Date(),
          reference_type: reference_type || event_type,
          reference_id: reference_id || null,
          description: description || template.event_description,
          total_debit: amount || 0,
          total_credit: amount || 0,
          currency: "INR",
          is_posted: template.auto_post,
          posted_at: template.auto_post ? new Date() : null,
          posted_by: template.auto_post ? req?.session?.user_id : null,
          is_active: true,
          created_by: req?.session?.user_id,
        },
        { transaction },
      );

      // Create debit journal line
      await models.journal_line.create(
        {
          journal_entry_id: journalEntry.id,
          account_id: template.debit_account_id,
          account_code: template.debit_account.account_code,
          account_name: template.debit_account.account_name,
          debit_amount: amount || 0,
          credit_amount: 0,
          description: `${template.event_description} - Debit`,
          line_number: 1,
          is_active: true,
          created_by: req?.session?.user_id,
        },
        { transaction },
      );

      // Create credit journal line
      await models.journal_line.create(
        {
          journal_entry_id: journalEntry.id,
          account_id: template.credit_account_id,
          account_code: template.credit_account.account_code,
          account_name: template.credit_account.account_name,
          debit_amount: 0,
          credit_amount: amount || 0,
          description: `${template.event_description} - Credit`,
          line_number: 2,
          is_active: true,
          created_by: req?.session?.user_id,
        },
        { transaction },
      );

      // Create audit trail
      await models.accounting_audit_trail.create(
        {
          journal_entry_id: journalEntry.id,
          action_type: "CREATED",
          action_description: `Journal entry created from template: ${event_type}`,
          created_by: req?.session?.user_id,
        },
        { transaction },
      );

      await transaction.commit();

      return res.code(201).send({
        success: true,
        data: journalEntry,
        message: `Journal entry created successfully from template: ${event_type}`,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error applying journal template:", error);
    return res.code(500).send({
      success: false,
      message: "Error applying journal template",
      error: error.message,
    });
  }
};
/**
 * Internal helper to apply a journal template from server-side code.
 * Returns the created journal_entry object (not the HTTP response).
 * Other controllers can import and call this function to auto-create
 * journal entries when their business events occur.
 */
export const ApplyJournalTemplateInternal = async ({
  event_type,
  reference_type,
  reference_id,
  amount,
  description,
  created_by,
}) => {
  // Get the template
  const template = await models.journal_template.findOne({
    where: { event_type, is_active: true },
    include: [
      { model: models.chart_of_accounts, as: "debit_account" },
      { model: models.chart_of_accounts, as: "credit_account" },
    ],
  });

  if (!template) {
    throw new Error(`No active template found for event type: ${event_type}`);
  }

  const transaction = await sequelize.transaction();

  try {
    // Generate entry number
    const lastEntry = await models.journal_entry.findOne({
      order: [["entry_number", "DESC"]],
      raw: true,
    });

    const entryNumber = lastEntry
      ? `JE-${parseInt(lastEntry.entry_number.split("-")[1]) + 1}`
      : "JE-1001";

    // Create journal entry
    const journalEntry = await models.journal_entry.create(
      {
        entry_number: entryNumber,
        entry_date: new Date(),
        reference_type: reference_type || event_type,
        reference_id: reference_id || null,
        description: description || template.event_description,
        total_debit: amount || 0,
        total_credit: amount || 0,
        currency: "INR",
        is_posted: template.auto_post,
        posted_at: template.auto_post ? new Date() : null,
        posted_by: template.auto_post ? created_by : null,
        is_active: true,
        created_by: created_by,
      },
      { transaction },
    );

    // Create debit journal line
    await models.journal_line.create(
      {
        journal_entry_id: journalEntry.id,
        account_id: template.debit_account_id,
        account_code: template.debit_account.account_code,
        account_name: template.debit_account.account_name,
        debit_amount: amount || 0,
        credit_amount: 0,
        description: `${template.event_description} - Debit`,
        line_number: 1,
        is_active: true,
        created_by: created_by,
      },
      { transaction },
    );

    // Create credit journal line
    await models.journal_line.create(
      {
        journal_entry_id: journalEntry.id,
        account_id: template.credit_account_id,
        account_code: template.credit_account.account_code,
        account_name: template.credit_account.account_name,
        debit_amount: 0,
        credit_amount: amount || 0,
        description: `${template.event_description} - Credit`,
        line_number: 2,
        is_active: true,
        created_by: created_by,
      },
      { transaction },
    );

    // Create audit trail
    await models.accounting_audit_trail.create(
      {
        journal_entry_id: journalEntry.id,
        action_type: "CREATED",
        action_description: `Journal entry created from template: ${event_type}`,
        created_by: created_by,
      },
      { transaction },
    );

    await transaction.commit();

    return journalEntry;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
/**
 * Get the Event → Journal Mapping Matrix for display
 * Returns formatted data for the UI
 */
export const GetJournalMappingMatrix = async (req, res) => {
  try {
    const templates = await models.journal_template.findAll({
      where: { is_active: true },
      include: [
        {
          model: models.chart_of_accounts,
          as: "debit_account",
          attributes: ["id", "account_code", "account_name"],
        },
        {
          model: models.chart_of_accounts,
          as: "credit_account",
          attributes: ["id", "account_code", "account_name"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    // Format for matrix display
    const matrix = templates.map((template) => ({
      event_type: template.event_type,
      event_description: template.event_description,
      debit_account: `${template.debit_account?.account_code} - ${template.debit_account?.account_name}`,
      credit_account: `${template.credit_account?.account_code} - ${template.credit_account?.account_name}`,
      auto_post: template.auto_post,
      is_active: template.is_active,
      notes: template.notes,
    }));

    return res.code(200).send({
      success: true,
      data: matrix,
      total_mappings: matrix.length,
      message: "Journal mapping matrix retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching journal mapping matrix:", error);
    return res.code(500).send({
      success: false,
      message: "Error fetching journal mapping matrix",
      error: error.message,
    });
  }
};

export default {
  GetAllJournalTemplates,
  GetJournalTemplateByEvent,
  SaveJournalTemplate,
  ApplyJournalTemplate,
  ApplyJournalTemplateInternal,
  GetJournalMappingMatrix,
};
