const ProfitabilityEngineService = require("../../services/ProfitabilityEngineService.js");

class ProfitabilityController {
  constructor() {
    this.profitabilityEngine = new ProfitabilityEngineService();
  }

  /**
   * Calculate profitability for a posted invoice
   * POST /api/profitability/calculate
   */
  async calculateInvoiceProfitability(request, reply) {
    try {
      const { body } = request;
      const context = {
        userId: request.user?.id,
      };

      const result =
        await this.profitabilityEngine.calculateInvoiceProfitability(body);

      reply.code(200).send(result);
    } catch (error) {
      console.error("Error calculating invoice profitability:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get species profitability analysis
   * GET /api/profitability/species
   */
  async getSpeciesProfitability(request, reply) {
    try {
      const { query } = request;
      const filters = {
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const data = await this.profitabilityEngine.getSpeciesProfitability(
        filters
      );

      reply.code(200).send({
        success: true,
        data: data,
      });
    } catch (error) {
      console.error("Error getting species profitability:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get customer margin ranking
   * GET /api/profitability/customers
   */
  async getCustomerMarginRanking(request, reply) {
    try {
      const { query } = request;
      const filters = {
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const data = await this.profitabilityEngine.getCustomerMarginRanking(
        filters
      );

      reply.code(200).send({
        success: true,
        data: data,
      });
    } catch (error) {
      console.error("Error getting customer margin ranking:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get SKU profitability analysis (identifies killers)
   * GET /api/profitability/skus
   */
  async getSKUProfitability(request, reply) {
    try {
      const { query } = request;
      const filters = {
        startDate: query.startDate,
        endDate: query.endDate,
      };

      const data = await this.profitabilityEngine.getSKUProfitability(filters);

      reply.code(200).send({
        success: true,
        data: data,
        message: `Found ${data.length} unprofitable SKUs`,
      });
    } catch (error) {
      console.error("Error getting SKU profitability:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get active alerts
   * GET /api/profitability/alerts
   */
  async getActiveAlerts(request, reply) {
    try {
      const { query } = request;
      const filters = {
        severity: query.severity,
        alertType: query.alertType,
        limit: query.limit ? parseInt(query.limit) : 100,
      };

      const alerts = await this.profitabilityEngine.getActiveAlerts(filters);

      reply.code(200).send({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      console.error("Error getting active alerts:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Acknowledge alert
   * POST /api/profitability/alerts/:alertId/acknowledge
   */
  async acknowledgeAlert(request, reply) {
    try {
      const { alertId } = request.params;
      const userId = request.user?.id;

      const alert = await this.profitabilityEngine.acknowledgeAlert(
        alertId,
        userId
      );

      reply.code(200).send({
        success: true,
        data: alert,
        message: "Alert acknowledged successfully",
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get profitability drilldown
   * GET /api/profitability/drilldown/:profitabilityId
   */
  async getProfitabilityDrilldown(request, reply) {
    try {
      const { profitabilityId } = request.params;

      const data = await this.profitabilityEngine.getProfitabilityDrilldown(
        profitabilityId
      );

      if (!data) {
        return reply.code(404).send({
          success: false,
          error: "Profitability record not found",
        });
      }

      reply.code(200).send({
        success: true,
        data: data,
      });
    } catch (error) {
      console.error("Error getting profitability drilldown:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get profitability dashboard summary
   * GET /api/profitability/dashboard
   */
  async getDashboardSummary(request, reply) {
    try {
      const { query } = request;
      const filters = {
        startDate:
          query.startDate ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Last 30 days
        endDate: query.endDate || new Date().toISOString().split("T")[0],
      };

      // Get multiple datasets in parallel
      const [speciesData, customerData, skuData, alerts] = await Promise.all([
        this.profitabilityEngine.getSpeciesProfitability(filters),
        this.profitabilityEngine.getCustomerMarginRanking(filters),
        this.profitabilityEngine.getSKUProfitability(filters),
        this.profitabilityEngine.getActiveAlerts({ limit: 10 }),
      ]);

      // Calculate summary metrics
      const totalRevenue = speciesData.reduce(
        (sum, s) => sum + parseFloat(s.total_revenue || 0),
        0
      );
      const totalMargin = speciesData.reduce(
        (sum, s) => sum + parseFloat(s.total_margin || 0),
        0
      );
      const avgMarginPct =
        totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

      const summary = {
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        metrics: {
          totalRevenue: totalRevenue.toFixed(2),
          totalMargin: totalMargin.toFixed(2),
          avgMarginPct: avgMarginPct.toFixed(2),
          speciesCount: speciesData.length,
          customerCount: customerData.length,
          unprofitableSKUs: skuData.length,
          activeAlerts: alerts.length,
        },
        topSpecies: speciesData.slice(0, 5),
        topCustomers: customerData.slice(0, 5),
        problemSKUs: skuData.slice(0, 5),
        recentAlerts: alerts.slice(0, 5),
      };

      reply.code(200).send({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Error getting dashboard summary:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Get profitability by market segment
   * GET /api/profitability/market-analysis
   */
  async getMarketAnalysis(request, reply) {
    try {
      const { query } = request;
      const models = await import("../../models/index.js");
      const { ProfitabilityFact, sequelize } = models.default;

      const whereClause = {};
      if (query.startDate && query.endDate) {
        whereClause.posting_date = {
          [models.default.Sequelize.Op.between]: [
            query.startDate,
            query.endDate,
          ],
        };
      }

      const marketData = await ProfitabilityFact.findAll({
        where: whereClause,
        attributes: [
          "market",
          [sequelize.fn("SUM", sequelize.col("net_revenue")), "total_revenue"],
          [sequelize.fn("SUM", sequelize.col("gross_margin")), "total_margin"],
          [
            sequelize.fn("AVG", sequelize.col("gross_margin_pct")),
            "avg_margin_pct",
          ],
          [sequelize.fn("COUNT", sequelize.col("id")), "transaction_count"],
        ],
        group: ["market"],
        order: [[sequelize.fn("SUM", sequelize.col("net_revenue")), "DESC"]],
        raw: true,
      });

      reply.code(200).send({
        success: true,
        data: marketData,
      });
    } catch (error) {
      console.error("Error getting market analysis:", error);
      reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = ProfitabilityController;
