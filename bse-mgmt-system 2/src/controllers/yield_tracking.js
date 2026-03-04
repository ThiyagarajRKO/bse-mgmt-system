import models from "../../models";
import YieldCalculationService from "../services/yield_calculation.js";

/**
 * Yield Tracking Controller
 * Handles yield standards, yield capture, and yield analytics
 */
export class YieldTrackingController {
  /**
   * Create yield standard
   * POST /api/yield/standards
   */
  static async createYieldStandard(request, reply) {
    try {
      const {
        species_id,
        product_form,
        processing_type,
        expected_yield_pct,
        allowed_variance_pct,
      } = request.body;

      const profile_id = request.user?.profile_id;

      if (
        !species_id ||
        !product_form ||
        !processing_type ||
        !expected_yield_pct
      ) {
        return reply.code(400).send({
          error: "Validation Error",
          message:
            "species_id, product_form, processing_type, and expected_yield_pct are required",
        });
      }

      // Calculate thresholds
      const minThreshold = expected_yield_pct - allowed_variance_pct;
      const maxThreshold = expected_yield_pct + allowed_variance_pct;

      const yieldStandard = await models.YieldStandardMaster.create({
        species_id,
        product_form,
        processing_type,
        expected_yield_pct,
        allowed_variance_pct,
        min_yield_threshold: minThreshold,
        max_yield_threshold: maxThreshold,
        created_by: profile_id,
        updated_by: profile_id,
      });

      return reply.code(201).send({
        success: true,
        message: "Yield standard created successfully",
        data: {
          id: yieldStandard.id,
          species_id: yieldStandard.species_id,
          product_form: yieldStandard.product_form,
          processing_type: yieldStandard.processing_type,
          expected_yield_pct: yieldStandard.expected_yield_pct,
          allowed_variance_pct: yieldStandard.allowed_variance_pct,
        },
      });
    } catch (error) {
      console.error("Error creating yield standard:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to create yield standard",
      });
    }
  }

  /**
   * Get yield standards
   * GET /api/yield/standards
   */
  static async getYieldStandards(request, reply) {
    try {
      const { species_id, product_form, processing_type } = request.query;

      const whereClause = { is_active: true };

      if (species_id) whereClause.species_id = species_id;
      if (product_form) whereClause.product_form = product_form;
      if (processing_type) whereClause.processing_type = processing_type;

      const yieldStandards = await models.YieldStandardMaster.findAll({
        where: whereClause,
        include: [
          {
            model: models.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
        ],
        order: [
          ["species_id", "ASC"],
          ["product_form", "ASC"],
          ["processing_type", "ASC"],
        ],
      });

      return reply.code(200).send({
        success: true,
        data: yieldStandards.map((ys) => ({
          id: ys.id,
          species_id: ys.species_id,
          species_name: ys.species?.species_name,
          product_form: ys.product_form,
          processing_type: ys.processing_type,
          expected_yield_pct: ys.expected_yield_pct,
          allowed_variance_pct: ys.allowed_variance_pct,
          min_yield_threshold: ys.min_yield_threshold,
          max_yield_threshold: ys.max_yield_threshold,
        })),
      });
    } catch (error) {
      console.error("Error fetching yield standards:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch yield standards",
      });
    }
  }

  /**
   * Capture yield after packing list finalization
   * POST /api/yield/capture
   */
  static async captureYield(request, reply) {
    try {
      const { packing_list_id } = request.body;
      const profile_id = request.user?.profile_id;

      if (!packing_list_id) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "packing_list_id is required",
        });
      }

      if (!profile_id) {
        return reply.code(401).send({
          error: "Authentication Error",
          message: "User profile not found",
        });
      }

      const result = await YieldCalculationService.captureYield({
        packing_list_id,
        profile_id,
      });

      return reply.code(201).send({
        success: true,
        message: "Yield captured successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error capturing yield:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to capture yield",
      });
    }
  }

  /**
   * Get yield dashboard data
   * GET /api/yield/dashboard
   */
  static async getYieldDashboard(request, reply) {
    try {
      const { start_date, end_date, species_id } = request.query;

      if (!start_date || !end_date) {
        return reply.code(400).send({
          error: "Validation Error",
          message: "start_date and end_date are required",
        });
      }

      const result = await YieldCalculationService.getYieldDashboard({
        start_date,
        end_date,
        species_id,
      });

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching yield dashboard:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch yield dashboard",
      });
    }
  }

  /**
   * Get yield actual records
   * GET /api/yield/actual
   */
  static async getYieldActual(request, reply) {
    try {
      const {
        packing_list_id,
        species_id,
        status,
        page = 1,
        limit = 10,
      } = request.query;

      const whereClause = { is_active: true };
      const offset = (page - 1) * limit;

      if (packing_list_id) whereClause.packing_list_id = packing_list_id;
      if (species_id) whereClause.species_id = species_id;
      if (status) whereClause.status = status;

      const { count, rows } = await models.YieldActual.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: models.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
          {
            model: models.PackingList,
            as: "packingList",
            attributes: ["packing_list_no"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset,
      });

      return reply.code(200).send({
        success: true,
        data: {
          yields: rows.map((ya) => ({
            id: ya.id,
            packing_list_no: ya.packingList?.packing_list_no,
            species_name: ya.species?.species_name,
            product_form: ya.product_form,
            processing_type: ya.processing_type,
            raw_input_kg: ya.raw_input_kg,
            saleable_output_kg: ya.saleable_output_kg,
            actual_yield_pct: ya.actual_yield_pct,
            expected_yield_pct: ya.expected_yield_pct,
            variance_pct: ya.variance_pct,
            loss_kg: ya.loss_kg,
            loss_value: ya.loss_value,
            status: ya.status,
            supervisor_approved: ya.supervisor_approved,
            created_at: ya.created_at,
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching yield actual:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch yield actual",
      });
    }
  }
}

export default YieldTrackingController;
