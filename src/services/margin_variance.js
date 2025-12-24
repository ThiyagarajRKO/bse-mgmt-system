import models from "../../models";

const { MarginVariance, Invoice, YieldActual, SalesRegister } = models;

/**
 * Margin Variance Service
 * Handles margin variance calculations and accounting treatment
 */
export class MarginVarianceService {
  /**
   * Calculate and post margin variance for finalized invoice
   * @param {Object} params - { invoice_id, profile_id }
   * @returns {Object} - Margin variance calculation result
   */
  static async processMarginVariance({ invoice_id, profile_id }) {
    try {
      // Check if margin variance already exists
      const existingVariance = await MarginVariance.findOne({
        where: {
          invoice_id,
          is_active: true,
        },
      });

      if (existingVariance) {
        throw new Error("Margin variance already calculated for this invoice");
      }

      // Get invoice with line items and yield data
      const invoice = await Invoice.findOne({
        where: {
          id: invoice_id,
          status: "FINAL",
          is_active: true,
        },
        include: [
          {
            model: models.InvoiceLineItem,
            as: "lineItems",
            where: { is_active: true },
            required: false,
          },
          {
            model: models.PackingList,
            as: "packingList",
            include: [
              {
                model: YieldActual,
                as: "yieldActuals",
                where: { is_active: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found or not finalized");
      }

      if (!invoice.packingList || !invoice.packingList.yieldActuals) {
        throw new Error("No yield data found for this invoice");
      }

      const marginVariances = [];
      let totalMarginErosion = 0;

      // Calculate margin variance for each line item
      for (const lineItem of invoice.lineItems) {
        const yieldActual = invoice.packingList.yieldActuals.find(
          (ya) => ya.species_id === lineItem.product_id
        );

        if (!yieldActual) continue;

        const variance = await this.calculateLineItemVariance({
          line_item: lineItem,
          yield_actual: yieldActual,
          invoice,
          profile_id,
        });

        marginVariances.push(variance);
        totalMarginErosion += parseFloat(variance.margin_variance_value);
      }

      // Determine if supervisor approval is required
      const requiresApproval = invoice.packingList.yieldActuals.some(
        (ya) => ya.status === "BREACH"
      );

      // If BREACH and not approved, block margin posting
      if (
        requiresApproval &&
        !invoice.packingList.yieldActuals.every((ya) => ya.supervisor_approved)
      ) {
        throw new Error(
          "BREACH detected - supervisor approval required before margin posting"
        );
      }

      return {
        invoice_id,
        invoice_no: invoice.invoice_no,
        margin_variances: marginVariances,
        total_margin_erosion: totalMarginErosion,
        requires_supervisor_approval: requiresApproval,
        can_post_to_gl:
          !requiresApproval ||
          invoice.packingList.yieldActuals.every(
            (ya) => ya.supervisor_approved
          ),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate margin variance for a single line item
   * @param {Object} params - { line_item, yield_actual, invoice, profile_id }
   * @returns {Object} - Line item variance calculation
   */
  static async calculateLineItemVariance({
    line_item,
    yield_actual,
    invoice,
    profile_id,
  }) {
    try {
      const saleQuantityKg = line_item.quantity;
      const saleRate = line_item.rate;
      const saleAmount = line_item.amount;

      // Standard cost per kg = Raw cost / Expected yield %
      const standardCostPerKg =
        yield_actual.raw_cost_per_kg / (yield_actual.expected_yield_pct / 100);

      // Actual cost per kg = Raw cost / Actual yield %
      const actualCostPerKg =
        yield_actual.raw_cost_per_kg / (yield_actual.actual_yield_pct / 100);

      // Margin variance = (Standard cost - Actual cost) × Sale quantity
      const marginVarianceValue =
        (standardCostPerKg - actualCostPerKg) * saleQuantityKg;

      // Determine accounting treatment
      let accountingTreatment = "NORMAL_LOSS";
      if (yield_actual.status === "BREACH") {
        accountingTreatment = "EXCESS_LOSS_EXPENSE";
      } else if (marginVarianceValue > 0) {
        // Positive variance means better than expected (margin improvement)
        accountingTreatment = "MARGIN_OFFSET";
      }

      // Create margin variance record
      const marginVariance = await MarginVariance.create({
        invoice_id: invoice.id,
        yield_actual_id: yield_actual.id,
        sale_quantity_kg: saleQuantityKg,
        standard_cost_per_kg: standardCostPerKg,
        actual_cost_per_kg: actualCostPerKg,
        margin_variance_value: marginVarianceValue,
        reason_codes: yield_actual.reason_codes,
        accounting_treatment: accountingTreatment,
        created_by: profile_id,
        updated_by: profile_id,
      });

      return {
        margin_variance_id: marginVariance.id,
        product_name: line_item.product_name,
        sale_quantity_kg: saleQuantityKg,
        sale_rate: saleRate,
        sale_amount: saleAmount,
        standard_cost_per_kg: standardCostPerKg,
        actual_cost_per_kg: actualCostPerKg,
        margin_variance_value: marginVarianceValue,
        accounting_treatment: accountingTreatment,
        yield_status: yield_actual.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve margin variance (for BREACH cases)
   * @param {Object} params - { margin_variance_id, profile_id, notes }
   * @returns {Object} - Approval result
   */
  static async approveMarginVariance({
    margin_variance_id,
    profile_id,
    notes,
  }) {
    try {
      const marginVariance = await MarginVariance.findOne({
        where: {
          id: margin_variance_id,
          is_active: true,
        },
        include: [
          {
            model: YieldActual,
            as: "yieldActual",
          },
        ],
      });

      if (!marginVariance) {
        throw new Error("Margin variance not found");
      }

      // Update yield actual with approval
      await marginVariance.yieldActual.update({
        supervisor_approved: true,
        approved_by: profile_id,
        approved_at: new Date(),
        notes: notes || marginVariance.yieldActual.notes,
        updated_by: profile_id,
      });

      return {
        margin_variance_id: marginVariance.id,
        approved: true,
        approved_by: profile_id,
        approved_at: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Post margin variance to GL
   * @param {Object} params - { invoice_id, profile_id }
   * @returns {Object} - GL posting result
   */
  static async postToGL({ invoice_id, profile_id }) {
    try {
      const marginVariances = await MarginVariance.findAll({
        where: {
          invoice_id,
          gl_posted: false,
          is_active: true,
        },
        include: [
          {
            model: Invoice,
            as: "invoice",
          },
          {
            model: YieldActual,
            as: "yieldActual",
          },
        ],
      });

      if (!marginVariances || marginVariances.length === 0) {
        throw new Error("No unposted margin variances found for this invoice");
      }

      // Check if all variances are approved (for BREACH cases)
      const unapprovedBreaches = marginVariances.filter(
        (mv) =>
          mv.yieldActual.status === "BREACH" &&
          !mv.yieldActual.supervisor_approved
      );

      if (unapprovedBreaches.length > 0) {
        throw new Error("BREACH variances must be approved before GL posting");
      }

      // Group by accounting treatment for GL entries
      const glEntries = {};
      marginVariances.forEach((mv) => {
        const treatment = mv.accounting_treatment;
        if (!glEntries[treatment]) {
          glEntries[treatment] = {
            amount: 0,
            variances: [],
          };
        }
        glEntries[treatment].amount += parseFloat(mv.margin_variance_value);
        glEntries[treatment].variances.push(mv.id);
      });

      // Create GL entries (this would integrate with your GL system)
      const glEntryIds = [];
      for (const [treatment, data] of Object.entries(glEntries)) {
        const glEntryId = await this.createGLEntry({
          treatment,
          amount: data.amount,
          invoice_id,
          profile_id,
        });
        glEntryIds.push(glEntryId);

        // Update margin variances with GL entry ID
        await MarginVariance.update(
          { gl_posted: true, gl_entry_id: glEntryId },
          {
            where: {
              id: { [models.Sequelize.Op.in]: data.variances },
            },
          }
        );
      }

      return {
        invoice_id,
        gl_entries_created: glEntryIds.length,
        total_amount_posted: Object.values(glEntries).reduce(
          (sum, entry) => sum + entry.amount,
          0
        ),
        gl_entry_ids: glEntryIds,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create GL entry (placeholder - integrate with your GL system)
   * @param {Object} params - { treatment, amount, invoice_id, profile_id }
   * @returns {string} - GL entry ID
   */
  static async createGLEntry({ treatment, amount, invoice_id, profile_id }) {
    try {
      // This is a placeholder - integrate with your actual GL system
      const glEntryId = `GL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // In a real implementation, this would:
      // 1. Determine appropriate GL accounts based on treatment
      // 2. Create journal entries
      // 3. Update ledger balances

      console.log(
        `GL Entry created: ${glEntryId} for ${treatment} amount ${amount}`
      );

      return glEntryId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get margin variance report
   * @param {Object} params - { start_date, end_date, species_id, status }
   * @returns {Object} - Margin variance report
   */
  static async getMarginVarianceReport({
    start_date,
    end_date,
    species_id,
    status,
  }) {
    try {
      const whereClause = {
        is_active: true,
        created_at: {
          [models.Sequelize.Op.between]: [start_date, end_date],
        },
      };

      const includeClause = [
        {
          model: Invoice,
          as: "invoice",
          attributes: ["invoice_no", "invoice_date", "customer_id"],
        },
        {
          model: YieldActual,
          as: "yieldActual",
          include: [
            {
              model: models.SpeciesMaster,
              as: "species",
              attributes: ["species_name"],
            },
          ],
        },
      ];

      if (species_id) {
        includeClause[1].where = { species_id };
      }

      if (status) {
        includeClause[1].where = {
          ...includeClause[1].where,
          status,
        };
      }

      const marginVariances = await MarginVariance.findAll({
        where: whereClause,
        include: includeClause,
        order: [["created_at", "DESC"]],
      });

      // Calculate summary metrics
      const totalRecords = marginVariances.length;
      const totalMarginErosion = marginVariances.reduce(
        (sum, mv) => sum + parseFloat(mv.margin_variance_value),
        0
      );
      const positiveVariance = marginVariances.filter(
        (mv) => parseFloat(mv.margin_variance_value) > 0
      ).length;
      const negativeVariance = marginVariances.filter(
        (mv) => parseFloat(mv.margin_variance_value) < 0
      ).length;

      // Group by accounting treatment
      const byTreatment = {};
      marginVariances.forEach((mv) => {
        const treatment = mv.accounting_treatment;
        if (!byTreatment[treatment]) {
          byTreatment[treatment] = {
            count: 0,
            total_amount: 0,
          };
        }
        byTreatment[treatment].count++;
        byTreatment[treatment].total_amount += parseFloat(
          mv.margin_variance_value
        );
      });

      return {
        summary: {
          total_records: totalRecords,
          total_margin_erosion: totalMarginErosion.toFixed(2),
          positive_variance_count: positiveVariance,
          negative_variance_count: negativeVariance,
        },
        by_accounting_treatment: byTreatment,
        variances: marginVariances.map((mv) => ({
          id: mv.id,
          invoice_no: mv.invoice.invoice_no,
          invoice_date: mv.invoice.invoice_date,
          species_name: mv.yieldActual.species?.species_name,
          yield_status: mv.yieldActual.status,
          sale_quantity_kg: mv.sale_quantity_kg,
          margin_variance_value: mv.margin_variance_value,
          accounting_treatment: mv.accounting_treatment,
          gl_posted: mv.gl_posted,
          created_at: mv.created_at,
        })),
      };
    } catch (error) {
      throw error;
    }
  }
}

export default MarginVarianceService;
