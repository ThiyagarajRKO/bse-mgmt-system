const PricingEngineService = require("../../services/PricingEngineService.js");

class PricingController {
  constructor() {
    this.pricingEngine = new PricingEngineService();
  }

  /**
   * Calculate price for a batch
   * POST /api/pricing/calculate
   */
  async calculateBatchPrice(request, reply) {
    try {
      const { body } = request;
      const context = {
        userId: request.user?.id,
      };

      const result = await this.pricingEngine.calculateBatchPrice(
        body,
        context
      );

      reply.code(200).send(result);
    } catch (error) {
      console.error("Error calculating batch price:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get pricing history for a batch
   * GET /api/pricing/history/:batchId
   */
  async getBatchPricingHistory(request, reply) {
    try {
      const { batchId } = request.params;

      const history = await this.pricingEngine.getBatchPricingHistory(batchId);

      reply.code(200).send({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error getting pricing history:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Apply price override
   * POST /api/pricing/override/:snapshotId
   */
  async applyPriceOverride(request, reply) {
    try {
      const { snapshotId } = request.params;
      const { body } = request;
      const context = {
        userId: request.user?.id,
      };

      const result = await this.pricingEngine.applyPriceOverride(
        snapshotId,
        body,
        context
      );

      reply.code(200).send(result);
    } catch (error) {
      console.error("Error applying price override:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Approve or reject price snapshot
   * POST /api/pricing/approve/:snapshotId
   */
  async approveOrRejectPrice(request, reply) {
    try {
      const { snapshotId } = request.params;
      const { action, reason } = request.body;
      const context = {
        userId: request.user?.id,
      };

      const result = await this.pricingEngine.approveOrRejectPrice(
        snapshotId,
        action,
        context,
        reason
      );

      reply.code(200).send(result);
    } catch (error) {
      console.error("Error approving/rejecting price:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get price snapshot details
   * GET /api/pricing/snapshot/:snapshotId
   */
  async getPriceSnapshot(request, reply) {
    try {
      const { snapshotId } = request.params;
      const models = await import("../models/index.js");
      const { PriceSnapshot } = models.default;

      const snapshot = await PriceSnapshot.findByPk(snapshotId, {
        include: [
          {
            model: models.default.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
          {
            model: models.default.ProcurementLots,
            as: "batch",
            attributes: ["lot_number", "procurement_date"],
          },
        ],
      });

      if (!snapshot) {
        return reply.code(404).send({
          success: false,
          error: "Price snapshot not found",
        });
      }

      reply.code(200).send({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      console.error("Error getting price snapshot:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get pending approvals
   * GET /api/pricing/pending-approvals
   */
  async getPendingApprovals(request, reply) {
    try {
      const models = await import("../models/index.js");
      const { PriceSnapshot } = models.default;

      const pendingApprovals = await PriceSnapshot.findAll({
        where: {
          status: "CALCULATED",
        },
        include: [
          {
            model: models.default.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
          {
            model: models.default.ProcurementLots,
            as: "batch",
            attributes: ["lot_number", "procurement_date"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      reply.code(200).send({
        success: true,
        data: pendingApprovals,
      });
    } catch (error) {
      console.error("Error getting pending approvals:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get pricing analytics
   * GET /api/pricing/analytics
   */
  async getPricingAnalytics(request, reply) {
    try {
      const { query } = request;
      const models = await import("../models/index.js");
      const { PriceSnapshot, sequelize } = models.default;

      const whereClause = {};
      if (query.speciesId) whereClause.species_id = query.speciesId;
      if (query.productForm) whereClause.product_form = query.productForm;
      if (query.market) whereClause.market = query.market;
      if (query.status) whereClause.status = query.status;

      // Date range filter
      if (query.startDate && query.endDate) {
        whereClause.created_at = {
          [models.default.Sequelize.Op.between]: [
            new Date(query.startDate),
            new Date(query.endDate),
          ],
        };
      }

      const analytics = await PriceSnapshot.findAll({
        where: whereClause,
        attributes: [
          "species_id",
          "product_form",
          "market",
          "status",
          [
            sequelize.fn("AVG", sequelize.col("effective_cost_per_kg")),
            "avg_effective_cost",
          ],
          [
            sequelize.fn("AVG", sequelize.col("calculated_price_ex_gst")),
            "avg_price_ex_gst",
          ],
          [
            sequelize.fn("AVG", sequelize.col("calculated_price_inc_gst")),
            "avg_price_inc_gst",
          ],
          [
            sequelize.fn("AVG", sequelize.col("yield_variance_pct")),
            "avg_yield_variance",
          ],
          [sequelize.fn("COUNT", sequelize.col("id")), "total_calculations"],
        ],
        group: ["species_id", "product_form", "market", "status"],
        include: [
          {
            model: models.default.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
        ],
        order: [["species_id"], ["product_form"], ["market"]],
      });

      reply.code(200).send({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Error getting pricing analytics:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = PricingController;
