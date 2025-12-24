import models from "../../models";
import MarginVarianceService from "../services/margin_variance.js";

/**
 * Margin Variance Controller
 * Handles margin variance calculations, approvals, and GL posting
 */
export class MarginVarianceController {
  /**
   * Process margin variance for finalized invoice
   * POST /api/margin-variance/process
   */
  static async processMarginVariance(request, reply) {
    try {
      const { invoice_id } = request.body;
      const profile_id = request.user?.profile_id;

      if (!invoice_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "invoice_id is required",
        });
      }

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await MarginVarianceService.processMarginVariance({
        invoice_id,
        profile_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Margin variance processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error processing margin variance:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to process margin variance",
      });
    }
  }

  /**
   * Approve margin variance (for BREACH cases)
   * PUT /api/margin-variance/:id/approve
   */
  static async approveMarginVariance(request, reply) {
    try {
      const { id } = request.params;
      const { notes } = request.body;
      const profile_id = request.user?.profile_id;

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await MarginVarianceService.approveMarginVariance({
        margin_variance_id: id,
        profile_id,
        notes,
      });

      return reply.code(200).send({
        success: true,
        message: "Margin variance approved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error approving margin variance:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to approve margin variance",
      });
    }
  }

  /**
   * Post margin variance to GL
   * POST /api/margin-variance/post-to-gl
   */
  static async postToGL(request, reply) {
    try {
      const { invoice_id } = request.body;
      const profile_id = request.user?.profile_id;

      if (!invoice_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "invoice_id is required",
        });
      }

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await MarginVarianceService.postToGL({
        invoice_id,
        profile_id,
      });

      return reply.code(200).send({
        success: true,
        message: "Margin variance posted to GL successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error posting to GL:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to post to GL",
      });
    }
  }

  /**
   * Get margin variance report
   * GET /api/margin-variance/report
   */
  static async getMarginVarianceReport(request, reply) {
    try {
      const { start_date, end_date, species_id, status } = request.query;

      if (!start_date || !end_date) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "start_date and end_date are required",
        });
      }

      const result = await MarginVarianceService.getMarginVarianceReport({
        start_date,
        end_date,
        species_id,
        status,
      });

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching margin variance report:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch margin variance report",
      });
    }
  }

  /**
   * Get margin variances by invoice
   * GET /api/margin-variance/invoice/:invoice_id
   */
  static async getMarginVariancesByInvoice(request, reply) {
    try {
      const { invoice_id } = request.params;

      const marginVariances = await models.MarginVariance.findAll({
        where: {
          invoice_id,
          is_active: true,
        },
        include: [
          {
            model: models.YieldActual,
            as: "yieldActual",
            include: [
              {
                model: models.SpeciesMaster,
                as: "species",
                attributes: ["species_name"],
              },
            ],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      return reply.code(200).send({
        success: true,
        data: marginVariances.map((mv) => ({
          id: mv.id,
          yield_actual_id: mv.yield_actual_id,
          species_name: mv.yieldActual?.species?.species_name,
          sale_quantity_kg: mv.sale_quantity_kg,
          standard_cost_per_kg: mv.standard_cost_per_kg,
          actual_cost_per_kg: mv.actual_cost_per_kg,
          margin_variance_value: mv.margin_variance_value,
          accounting_treatment: mv.accounting_treatment,
          reason_codes: mv.reason_codes,
          gl_posted: mv.gl_posted,
          gl_entry_id: mv.gl_entry_id,
          created_at: mv.created_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching margin variances by invoice:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch margin variances",
      });
    }
  }

  /**
   * Get pending approvals (BREACH cases needing supervisor approval)
   * GET /api/margin-variance/pending-approvals
   */
  static async getPendingApprovals(request, reply) {
    try {
      const marginVariances = await models.MarginVariance.findAll({
        where: {
          is_active: true,
        },
        include: [
          {
            model: models.YieldActual,
            as: "yieldActual",
            where: {
              status: "BREACH",
              supervisor_approved: false,
            },
            required: true,
            include: [
              {
                model: models.SpeciesMaster,
                as: "species",
                attributes: ["species_name"],
              },
            ],
          },
          {
            model: models.Invoice,
            as: "invoice",
            attributes: ["invoice_no", "invoice_date"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return reply.code(200).send({
        success: true,
        data: marginVariances.map((mv) => ({
          id: mv.id,
          invoice_no: mv.invoice?.invoice_no,
          invoice_date: mv.invoice?.invoice_date,
          species_name: mv.yieldActual?.species?.species_name,
          margin_variance_value: mv.margin_variance_value,
          reason_codes: mv.yieldActual?.reason_codes,
          created_at: mv.created_at,
        })),
      });
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch pending approvals",
      });
    }
  }
}

export default MarginVarianceController;
