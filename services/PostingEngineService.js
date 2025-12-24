import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import models from "../models/index.js";
import TaxResolutionService from "./TaxResolutionService.js";
import MarginVarianceService from "./MarginVarianceService.js";

const {
  PostingRuleMaster,
  JournalHeader,
  JournalLines,
  PostingAuditLog,
  ChartOfAccounts,
  sequelize,
} = models;

class PostingEngineService {
  constructor() {
    this.taxService = new TaxResolutionService();
    this.marginService = new MarginVarianceService();
  }

  /**
   * Main entry point for processing operational events
   * @param {Object} eventData - Event data containing event details
   * @param {Object} context - Context information (user, session, etc.)
   * @returns {Object} - Posting result
   */
  async processEvent(eventData, context = {}) {
    const startTime = Date.now();
    const auditLog = {
      event_code: eventData.eventCode,
      source_module: eventData.module,
      source_document_type: eventData.documentType,
      source_document_id: eventData.documentId,
      source_document_no: eventData.documentNo,
      action: "POSTING_ATTEMPT",
      status: "SUCCESS",
      input_data: eventData,
      user_id: context.userId,
      user_name: context.userName,
      ip_address: context.ipAddress,
      session_id: context.sessionId,
    };

    try {
      // Find applicable posting rules
      const rules = await this.findApplicableRules(eventData);

      if (rules.length === 0) {
        auditLog.action = "RULE_NOT_FOUND";
        auditLog.status = "FAILURE";
        auditLog.message = `No active posting rules found for event: ${eventData.eventCode}`;
        await this.logAudit(auditLog);
        throw new Error(auditLog.message);
      }

      // Process each rule and create journal entries
      const journalEntries = [];
      for (const rule of rules) {
        const journalEntry = await this.createJournalEntry(
          rule,
          eventData,
          context
        );
        journalEntries.push(journalEntry);
      }

      auditLog.output_data = {
        journalEntries: journalEntries.map((j) => j.journalNo),
      };
      auditLog.processing_time_ms = Date.now() - startTime;
      await this.logAudit(auditLog);

      return {
        success: true,
        journalEntries,
        message: `Successfully created ${journalEntries.length} journal entries`,
      };
    } catch (error) {
      auditLog.status = "FAILURE";
      auditLog.message = error.message;
      auditLog.error_details = {
        stack: error.stack,
        name: error.name,
      };
      auditLog.processing_time_ms = Date.now() - startTime;
      await this.logAudit(auditLog);

      throw error;
    }
  }

  /**
   * Find applicable posting rules for an event
   * @param {Object} eventData - Event data
   * @returns {Array} - Array of applicable rules
   */
  async findApplicableRules(eventData) {
    const whereClause = {
      event_code: eventData.eventCode,
      module: eventData.module,
      is_active: true,
      [Op.or]: [
        { effective_from: null },
        { effective_from: { [Op.lte]: new Date() } },
      ],
      [Op.or]: [
        { effective_to: null },
        { effective_to: { [Op.gte]: new Date() } },
      ],
    };

    // Add rule conditions if specified
    if (eventData.conditions) {
      whereClause.conditions = {
        [Op.contains]: eventData.conditions,
      };
    }

    const rules = await PostingRuleMaster.findAll({
      where: whereClause,
      order: [
        ["priority", "ASC"],
        ["created_at", "ASC"],
      ],
    });

    return rules;
  }

  /**
   * Create a journal entry based on a posting rule
   * @param {Object} rule - Posting rule
   * @param {Object} eventData - Event data
   * @param {Object} context - Context information
   * @returns {Object} - Created journal entry
   */
  async createJournalEntry(rule, eventData, context) {
    const transaction = await sequelize.transaction();

    try {
      // Generate journal number
      const journalNo = await this.generateJournalNumber(eventData.module);

      // Calculate posting amounts
      const postingAmounts = await this.calculatePostingAmounts(
        rule,
        eventData
      );

      // Create journal header
      const journalHeader = await JournalHeader.create(
        {
          journal_no: journalNo,
          journal_date: new Date(),
          posting_date: new Date(),
          source_module: eventData.module,
          source_document_type: eventData.documentType,
          source_document_id: eventData.documentId,
          source_document_no: eventData.documentNo,
          event_code: eventData.eventCode,
          description: this.generateJournalDescription(rule, eventData),
          total_debit: postingAmounts.totalDebit,
          total_credit: postingAmounts.totalCredit,
          status: "POSTED",
          posted_by: context.userId,
          posted_at: new Date(),
          is_system_generated: true,
          created_by: context.userId,
          updated_by: context.userId,
        },
        { transaction }
      );

      // Create journal lines
      const journalLines = [];
      for (const line of postingAmounts.lines) {
        const journalLine = await JournalLines.create(
          {
            journal_id: journalHeader.id,
            line_no: line.lineNo,
            gl_account_id: line.glAccountId,
            gl_account_code: line.glAccountCode,
            gl_account_name: line.glAccountName,
            debit_amount: line.debitAmount,
            credit_amount: line.creditAmount,
            amount: line.amount,
            business_partner_id: line.businessPartnerId,
            business_partner_code: line.businessPartnerCode,
            business_partner_name: line.businessPartnerName,
            assignment: line.assignment,
            text: line.text,
            reference_key_1: eventData.documentId,
            reference_key_2: eventData.documentNo,
            created_by: context.userId,
            updated_by: context.userId,
          },
          { transaction }
        );

        journalLines.push(journalLine);
      }

      // Log successful posting
      await PostingAuditLog.create(
        {
          journal_id: journalHeader.id,
          event_code: eventData.eventCode,
          source_module: eventData.module,
          source_document_type: eventData.documentType,
          source_document_id: eventData.documentId,
          source_document_no: eventData.documentNo,
          posting_rule_id: rule.id,
          posting_rule_code: rule.rule_code,
          action: "POSTING_SUCCESS",
          status: "SUCCESS",
          message: `Journal ${journalNo} created successfully`,
          input_data: eventData,
          output_data: { journalId: journalHeader.id, journalNo },
          user_id: context.userId,
          user_name: context.userName,
          ip_address: context.ipAddress,
          session_id: context.sessionId,
          created_by: context.userId,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        id: journalHeader.id,
        journalNo,
        totalDebit: postingAmounts.totalDebit,
        totalCredit: postingAmounts.totalCredit,
        lines: journalLines.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Calculate posting amounts based on rule and event data
   * @param {Object} rule - Posting rule
   * @param {Object} eventData - Event data
   * @returns {Object} - Calculated amounts and lines
   */
  async calculatePostingAmounts(rule, eventData) {
    const lines = [];
    let totalDebit = 0;
    let totalCredit = 0;
    let lineNo = 1;

    // Process debit account mappings
    for (const debitMapping of rule.debit_account_mappings) {
      const amount = await this.resolveAmount(debitMapping, eventData);
      const glAccount = await this.resolveGLAccount(debitMapping, eventData);

      if (amount > 0) {
        lines.push({
          lineNo: lineNo++,
          glAccountId: glAccount.id,
          glAccountCode: glAccount.account_code,
          glAccountName: glAccount.account_name,
          debitAmount: amount,
          creditAmount: 0,
          amount: amount,
          businessPartnerId: this.resolveBusinessPartner(
            debitMapping,
            eventData
          ),
          businessPartnerCode: this.resolveBusinessPartnerCode(
            debitMapping,
            eventData
          ),
          businessPartnerName: this.resolveBusinessPartnerName(
            debitMapping,
            eventData
          ),
          assignment: debitMapping.assignment || eventData.documentNo,
          text: debitMapping.text || rule.description,
        });

        totalDebit += amount;
      }
    }

    // Process credit account mappings
    for (const creditMapping of rule.credit_account_mappings) {
      const amount = await this.resolveAmount(creditMapping, eventData);
      const glAccount = await this.resolveGLAccount(creditMapping, eventData);

      if (amount > 0) {
        lines.push({
          lineNo: lineNo++,
          glAccountId: glAccount.id,
          glAccountCode: glAccount.account_code,
          glAccountName: glAccount.account_name,
          debitAmount: 0,
          creditAmount: amount,
          amount: -amount, // Negative for credit
          businessPartnerId: this.resolveBusinessPartner(
            creditMapping,
            eventData
          ),
          businessPartnerCode: this.resolveBusinessPartnerCode(
            creditMapping,
            eventData
          ),
          businessPartnerName: this.resolveBusinessPartnerName(
            creditMapping,
            eventData
          ),
          assignment: creditMapping.assignment || eventData.documentNo,
          text: creditMapping.text || rule.description,
        });

        totalCredit += amount;
      }
    }

    // Validate that debits equal credits
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Journal entry imbalance: Debit ${totalDebit}, Credit ${totalCredit}`
      );
    }

    return {
      totalDebit,
      totalCredit,
      lines,
    };
  }

  /**
   * Resolve amount from mapping and event data
   * @param {Object} mapping - Account mapping
   * @param {Object} eventData - Event data
   * @returns {number} - Resolved amount
   */
  async resolveAmount(mapping, eventData) {
    // Handle different amount resolution strategies
    if (mapping.amount_field) {
      return eventData[mapping.amount_field] || 0;
    }

    if (mapping.amount_calculation) {
      return this.calculateAmount(mapping.amount_calculation, eventData);
    }

    if (mapping.fixed_amount) {
      return mapping.fixed_amount;
    }

    // Default to base_amount if available
    return eventData.baseAmount || eventData.amount || 0;
  }

  /**
   * Calculate amount using formula
   * @param {string} formula - Calculation formula
   * @param {Object} eventData - Event data
   * @returns {number} - Calculated amount
   */
  calculateAmount(formula, eventData) {
    // Simple formula evaluation (can be enhanced)
    try {
      // Replace field references with actual values
      let expression = formula;
      const fieldRegex = /\$(\w+)/g;
      expression = expression.replace(fieldRegex, (match, fieldName) => {
        return eventData[fieldName] || 0;
      });

      // Evaluate the expression (in production, use a safer evaluation method)
      return Function('"use strict"; return (' + expression + ")")();
    } catch (error) {
      console.error("Error calculating amount:", error);
      return 0;
    }
  }

  /**
   * Resolve GL account from mapping
   * @param {Object} mapping - Account mapping
   * @param {Object} eventData - Event data
   * @returns {Object} - GL account
   */
  async resolveGLAccount(mapping, eventData) {
    let accountCode;

    if (mapping.account_code) {
      accountCode = mapping.account_code;
    } else if (mapping.account_field) {
      accountCode = eventData[mapping.account_field];
    } else if (mapping.account_rule) {
      accountCode = await this.applyAccountRule(
        mapping.account_rule,
        eventData
      );
    }

    if (!accountCode) {
      throw new Error("Unable to resolve GL account code from mapping");
    }

    const account = await ChartOfAccounts.findOne({
      where: {
        account_code: accountCode,
        is_active: true,
      },
    });

    if (!account) {
      throw new Error(`GL account not found: ${accountCode}`);
    }

    return account;
  }

  /**
   * Apply account resolution rule
   * @param {Object} rule - Account rule
   * @param {Object} eventData - Event data
   * @returns {string} - Account code
   */
  async applyAccountRule(rule, eventData) {
    // Implement account resolution logic based on rule type
    switch (rule.type) {
      case "species_based":
        return await this.resolveSpeciesAccount(rule, eventData);
      case "gst_based":
        return await this.resolveGSTAccount(rule, eventData);
      case "customer_based":
        return await this.resolveCustomerAccount(rule, eventData);
      default:
        return rule.default_account;
    }
  }

  /**
   * Resolve species-based account
   * @param {Object} rule - Account rule
   * @param {Object} eventData - Event data
   * @returns {string} - Account code
   */
  async resolveSpeciesAccount(rule, eventData) {
    // Implementation for species-based account resolution
    const speciesId = eventData.speciesId;
    if (speciesId && rule.species_mapping && rule.species_mapping[speciesId]) {
      return rule.species_mapping[speciesId];
    }
    return rule.default_account;
  }

  /**
   * Resolve GST-based account
   * @param {Object} rule - Account rule
   * @param {Object} eventData - Event data
   * @returns {string} - Account code
   */
  async resolveGSTAccount(rule, eventData) {
    // Implementation for GST-based account resolution
    const gstRate = eventData.gstRate;
    if (gstRate && rule.gst_mapping) {
      const gstKey = `${gstRate}%`;
      if (rule.gst_mapping[gstKey]) {
        return rule.gst_mapping[gstKey];
      }
    }
    return rule.default_account;
  }

  /**
   * Resolve customer-based account
   * @param {Object} rule - Account rule
   * @param {Object} eventData - Event data
   * @returns {string} - Account code
   */
  async resolveCustomerAccount(rule, eventData) {
    // Implementation for customer-based account resolution
    const customerId = eventData.customerId;
    if (
      customerId &&
      rule.customer_mapping &&
      rule.customer_mapping[customerId]
    ) {
      return rule.customer_mapping[customerId];
    }
    return rule.default_account;
  }

  /**
   * Resolve business partner from mapping
   * @param {Object} mapping - Account mapping
   * @param {Object} eventData - Event data
   * @returns {string} - Business partner ID
   */
  resolveBusinessPartner(mapping, eventData) {
    if (mapping.business_partner_field) {
      return eventData[mapping.business_partner_field];
    }
    return eventData.customerId || eventData.supplierId || eventData.vendorId;
  }

  /**
   * Resolve business partner code
   * @param {Object} mapping - Account mapping
   * @param {Object} eventData - Event data
   * @returns {string} - Business partner code
   */
  resolveBusinessPartnerCode(mapping, eventData) {
    if (mapping.business_partner_code_field) {
      return eventData[mapping.business_partner_code_field];
    }
    return (
      eventData.customerCode || eventData.supplierCode || eventData.vendorCode
    );
  }

  /**
   * Resolve business partner name
   * @param {Object} mapping - Account mapping
   * @param {Object} eventData - Event data
   * @returns {string} - Business partner name
   */
  resolveBusinessPartnerName(mapping, eventData) {
    if (mapping.business_partner_name_field) {
      return eventData[mapping.business_partner_name_field];
    }
    return (
      eventData.customerName || eventData.supplierName || eventData.vendorName
    );
  }

  /**
   * Generate journal description
   * @param {Object} rule - Posting rule
   * @param {Object} eventData - Event data
   * @returns {string} - Journal description
   */
  generateJournalDescription(rule, eventData) {
    if (rule.description_template) {
      let description = rule.description_template;
      // Replace placeholders with actual values
      const placeholderRegex = /\{\{(\w+)\}\}/g;
      description = description.replace(
        placeholderRegex,
        (match, fieldName) => {
          return eventData[fieldName] || match;
        }
      );
      return description;
    }

    return `${rule.rule_name} - ${eventData.documentNo || eventData.eventCode}`;
  }

  /**
   * Generate unique journal number
   * @param {string} module - Source module
   * @returns {string} - Journal number
   */
  async generateJournalNumber(module) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const prefix = this.getModulePrefix(module);
    const sequence = await this.getNextSequence(`${prefix}${year}${month}`);

    return `${prefix}${year}${month}${day}${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Get module prefix for journal numbering
   * @param {string} module - Source module
   * @returns {string} - Prefix
   */
  getModulePrefix(module) {
    const prefixes = {
      INVENTORY: "INV",
      SALES: "SAL",
      PURCHASE: "PUR",
      PRODUCTION: "PRO",
      GST: "GST",
      YIELD: "YLD",
      MANUAL: "MAN",
    };
    return prefixes[module] || "GEN";
  }

  /**
   * Get next sequence number for journal numbering
   * @param {string} key - Sequence key
   * @returns {number} - Next sequence number
   */
  async getNextSequence(key) {
    // In a real implementation, this would use a database sequence or counter
    // For now, we'll use a simple approach with current timestamp
    const timestamp = Date.now();
    return Math.floor(timestamp / 1000) % 10000; // Simple sequence based on timestamp
  }

  /**
   * Log audit entry
   * @param {Object} auditData - Audit data
   */
  async logAudit(auditData) {
    try {
      await PostingAuditLog.create(auditData);
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      // Don't throw here to avoid breaking the main flow
    }
  }

  /**
   * Reverse a journal entry
   * @param {string} journalId - Journal ID to reverse
   * @param {Object} context - Context information
   * @returns {Object} - Reversal result
   */
  async reverseJournal(journalId, context = {}) {
    const transaction = await sequelize.transaction();

    try {
      const originalJournal = await JournalHeader.findByPk(journalId, {
        include: [{ model: JournalLines, as: "journalLines" }],
        transaction,
      });

      if (!originalJournal) {
        throw new Error("Journal not found");
      }

      if (originalJournal.status === "REVERSED") {
        throw new Error("Journal is already reversed");
      }

      // Generate reversal journal number
      const reversalJournalNo = await this.generateJournalNumber("MANUAL");

      // Create reversal journal header
      const reversalHeader = await JournalHeader.create(
        {
          journal_no: reversalJournalNo,
          journal_date: new Date(),
          posting_date: new Date(),
          source_module: originalJournal.source_module,
          source_document_type: originalJournal.source_document_type,
          source_document_id: originalJournal.source_document_id,
          source_document_no: originalJournal.source_document_no,
          event_code: originalJournal.event_code,
          description: `Reversal of ${originalJournal.journal_no}`,
          total_debit: originalJournal.total_credit,
          total_credit: originalJournal.total_debit,
          status: "POSTED",
          posted_by: context.userId,
          posted_at: new Date(),
          is_system_generated: false,
          created_by: context.userId,
          updated_by: context.userId,
        },
        { transaction }
      );

      // Create reversal journal lines (reverse debits and credits)
      let lineNo = 1;
      for (const originalLine of originalJournal.journalLines) {
        await JournalLines.create(
          {
            journal_id: reversalHeader.id,
            line_no: lineNo++,
            gl_account_id: originalLine.gl_account_id,
            gl_account_code: originalLine.gl_account_code,
            gl_account_name: originalLine.gl_account_name,
            debit_amount: originalLine.credit_amount,
            credit_amount: originalLine.debit_amount,
            amount: -originalLine.amount,
            business_partner_id: originalLine.business_partner_id,
            business_partner_code: originalLine.business_partner_code,
            business_partner_name: originalLine.business_partner_name,
            assignment: `Reversal of ${originalLine.assignment}`,
            text: `Reversal of ${originalLine.text}`,
            reference_key_1: originalLine.reference_key_1,
            reference_key_2: originalLine.reference_key_2,
            created_by: context.userId,
            updated_by: context.userId,
          },
          { transaction }
        );
      }

      // Update original journal status
      await originalJournal.update(
        {
          status: "REVERSED",
          reversed_by: context.userId,
          reversed_at: new Date(),
          reversal_reason: context.reason || "Manual reversal",
          updated_by: context.userId,
        },
        { transaction }
      );

      // Log reversal
      await PostingAuditLog.create(
        {
          journal_id: reversalHeader.id,
          event_code: originalJournal.event_code,
          source_module: originalJournal.source_module,
          source_document_type: originalJournal.source_document_type,
          source_document_id: originalJournal.source_document_id,
          source_document_no: originalJournal.source_document_no,
          action: "POSTING_REVERSE",
          status: "SUCCESS",
          message: `Journal ${originalJournal.journal_no} reversed with ${reversalJournalNo}`,
          input_data: { originalJournalId: journalId },
          output_data: {
            reversalJournalId: reversalHeader.id,
            reversalJournalNo,
          },
          user_id: context.userId,
          user_name: context.userName,
          ip_address: context.ipAddress,
          session_id: context.sessionId,
          created_by: context.userId,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        originalJournal: originalJournal.journal_no,
        reversalJournal: reversalJournalNo,
        message: "Journal reversed successfully",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default PostingEngineService;
