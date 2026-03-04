const PriceRecommendationEngineService = require("../services/PriceRecommendationEngineService.js");
const models = require("../../models/index.js");
const { PriceRecommendation, RecommendationFeedback } = models;

class PriceRecommendationController {
  constructor() {
    this.recommendationEngine = new PriceRecommendationEngineService();
  }

  /**
   * Generate new price recommendations
   */
  async generateRecommendations(req, reply) {
    try {
      const { market, sku_codes, priority_threshold } = req.query;

      const options = {
        market: market || null,
        sku_codes: sku_codes ? sku_codes.split(",") : null,
        priority_threshold: priority_threshold || "LOW",
      };

      const result = await this.recommendationEngine.generateRecommendations(
        options
      );

      // Save recommendations to database
      if (result.recommendations.length > 0) {
        await this.recommendationEngine.saveRecommendations(
          result.recommendations,
          req.user?.id
        );
      }

      return reply.send({
        success: true,
        data: result,
        message: `Generated ${result.recommendations.length} price recommendations`,
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to generate price recommendations",
        details: error.message,
      });
    }
  }

  /**
   * Get all recommendations with filtering
   */
  async getRecommendations(req, reply) {
    try {
      const {
        status = "PENDING",
        priority,
        recommendation_type,
        market,
        sku_code,
        limit = 50,
        offset = 0,
      } = req.query;

      const whereClause = {
        status: status.toUpperCase(),
      };

      if (priority) whereClause.priority = priority.toUpperCase();
      if (recommendation_type)
        whereClause.recommendation_type = recommendation_type.toUpperCase();
      if (market) whereClause.market = market.toUpperCase();
      if (sku_code)
        whereClause.sku_code = { [models.Sequelize.Op.iLike]: `%${sku_code}%` };

      // Add expiry filter for pending recommendations
      if (status === "PENDING") {
        whereClause.expires_at = { [models.Sequelize.Op.gt]: new Date() };
      }

      const recommendations = await PriceRecommendation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: models.ProductMaster,
            as: "product",
            attributes: ["id", "product_name", "hsn_code"],
          },
          {
            model: models.SpeciesMaster,
            as: "species",
            attributes: ["id", "species_name", "species_code"],
          },
          {
            model: models.Users,
            as: "approver",
            attributes: ["id", "username"],
            required: false,
          },
        ],
        order: [
          ["priority", "DESC"],
          ["expected_margin_impact", "DESC"],
          ["created_at", "DESC"],
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return reply.send({
        success: true,
        data: {
          recommendations: recommendations.rows,
          total: recommendations.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch recommendations",
        details: error.message,
      });
    }
  }

  /**
   * Get specific recommendation by ID
   */
  async getRecommendationById(req, reply) {
    try {
      const { id } = req.params;

      const recommendation = await PriceRecommendation.findByPk(id, {
        include: [
          {
            model: models.ProductMaster,
            as: "product",
          },
          {
            model: models.SpeciesMaster,
            as: "species",
          },
          {
            model: models.Users,
            as: "approver",
            required: false,
          },
          {
            model: models.Users,
            as: "creator",
            required: false,
          },
          {
            model: RecommendationFeedback,
            as: "feedback",
            include: [
              {
                model: models.Users,
                as: "feedbackUser",
                attributes: ["id", "username", "full_name"],
              },
            ],
            order: [["feedback_at", "DESC"]],
          },
        ],
      });

      if (!recommendation) {
        return reply.code(404).send({
          success: false,
          error: "Recommendation not found",
        });
      }

      return reply.send({
        success: true,
        data: recommendation,
      });
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch recommendation",
        details: error.message,
      });
    }
  }

  /**
   * Approve or reject recommendation
   */
  async approveRecommendation(req, reply) {
    try {
      const { id } = req.params;
      const { decision, comments, actual_price_change } = req.body;

      const recommendation = await PriceRecommendation.findByPk(id);

      if (!recommendation) {
        return reply.code(404).send({
          success: false,
          error: "Recommendation not found",
        });
      }

      if (recommendation.status !== "PENDING") {
        return reply.code(400).send({
          success: false,
          error: "Recommendation is not in pending status",
        });
      }

      const newStatus = decision === "APPROVE" ? "APPROVED" : "REJECTED";

      await recommendation.update({
        status: newStatus,
        approved_by: req.user?.id,
        approved_at: new Date(),
        updated_by: req.user?.id,
      });

      // Create feedback record
      await RecommendationFeedback.create({
        recommendation_id: id,
        decision: decision === "APPROVE" ? "ACCEPTED" : "REJECTED",
        actual_price_change:
          actual_price_change || recommendation.recommended_price,
        feedback_reason: comments,
        feedback_by: req.user?.id,
        feedback_at: new Date(),
      });

      return reply.send({
        success: true,
        message: `Recommendation ${newStatus.toLowerCase()} successfully`,
        data: {
          recommendation_id: id,
          status: newStatus,
          approved_by: req.user?.id,
          approved_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error approving recommendation:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to approve recommendation",
        details: error.message,
      });
    }
  }

  /**
   * Implement approved recommendation (update price master)
   */
  async implementRecommendation(req, reply) {
    try {
      const { id } = req.params;

      const recommendation = await PriceRecommendation.findByPk(id);

      if (!recommendation) {
        return reply.code(404).send({
          success: false,
          error: "Recommendation not found",
        });
      }

      if (recommendation.status !== "APPROVED") {
        return reply.code(400).send({
          success: false,
          error: "Only approved recommendations can be implemented",
        });
      }

      // TODO: Integrate with price master update
      // For now, just mark as implemented

      await recommendation.update({
        status: "IMPLEMENTED",
        implemented_at: new Date(),
        updated_by: req.user?.id,
      });

      return reply.send({
        success: true,
        message: "Recommendation implemented successfully",
        data: {
          recommendation_id: id,
          implemented_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Error implementing recommendation:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to implement recommendation",
        details: error.message,
      });
    }
  }

  /**
   * Add feedback to recommendation
   */
  async addFeedback(req, reply) {
    try {
      const { id } = req.params;
      const {
        decision,
        actual_price_change,
        volume_impact_actual,
        margin_impact_actual,
        feedback_reason,
        market_feedback,
        lessons_learned,
      } = req.body;

      const recommendation = await PriceRecommendation.findByPk(id);

      if (!recommendation) {
        return reply.code(404).send({
          success: false,
          error: "Recommendation not found",
        });
      }

      const feedback = await RecommendationFeedback.create({
        recommendation_id: id,
        decision: decision.toUpperCase(),
        actual_price_change,
        volume_impact_actual,
        margin_impact_actual,
        feedback_reason,
        market_feedback,
        lessons_learned,
        feedback_by: req.user?.id,
        feedback_at: new Date(),
      });

      return reply.send({
        success: true,
        message: "Feedback added successfully",
        data: feedback,
      });
    } catch (error) {
      console.error("Error adding feedback:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to add feedback",
        details: error.message,
      });
    }
  }

  /**
   * Get CFO dashboard summary
   */
  async getCFODashboard(req, reply) {
    try {
      const dashboard = await this.recommendationEngine.getCFODashboard();

      return reply.send({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      console.error("Error fetching CFO dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch CFO dashboard",
        details: error.message,
      });
    }
  }

  /**
   * Get sales team dashboard
   */
  async getSalesDashboard(req, reply) {
    try {
      // Get customer elasticity data and discount risk analysis
      const salesData = await this.getSalesDashboardData();

      return reply.send({
        success: true,
        data: salesData,
      });
    } catch (error) {
      console.error("Error fetching sales dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch sales dashboard",
        details: error.message,
      });
    }
  }

  /**
   * Get sales dashboard data (customer elasticity, discount risks)
   */
  async getSalesDashboardData() {
    // Mock implementation - would analyze customer discount patterns
    return {
      customerElasticity: {
        highElasticity: ["Customer A", "Customer B"], // Price sensitive
        mediumElasticity: ["Customer C", "Customer D"],
        lowElasticity: ["Customer E", "Customer F"], // Can absorb price increases
      },
      discountRisks: {
        highRiskCustomers: ["Customer X", "Customer Y"],
        totalAtRiskValue: 250000,
        recommendedActions: [
          {
            customer: "Customer X",
            currentDiscount: "8%",
            recommendedMaxDiscount: "3%",
            potentialSavings: 45000,
          },
        ],
      },
      marketInsights: {
        priceIncreaseOpportunities: 3,
        competitorPriceChanges: [],
        demandTrends: "Stable with seasonal variations",
      },
    };
  }

  /**
   * Get yield vs price heatmap data
   */
  async getYieldPriceHeatmap(req, reply) {
    try {
      const { market, species_id } = req.query;

      // Get profitability data grouped by yield ranges and price ranges
      const heatmapData = await this.generateYieldPriceHeatmap(
        market,
        species_id
      );

      return reply.send({
        success: true,
        data: heatmapData,
      });
    } catch (error) {
      console.error("Error fetching yield-price heatmap:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch yield-price heatmap",
        details: error.message,
      });
    }
  }

  /**
   * Get CFO Dashboard Data
   */
  async getCFODashboard(req, reply) {
    try {
      const { PriceRecommendation } = models;

      // Get margin at risk
      const marginAtRiskResult = await PriceRecommendation.findAll({
        attributes: [
          [
            models.Sequelize.fn(
              "SUM",
              models.Sequelize.col("expected_margin_impact")
            ),
            "totalMarginAtRisk",
          ],
        ],
        where: {
          status: "PENDING",
          expected_margin_impact: {
            [models.Sequelize.Op.lt]: 0,
          },
        },
        raw: true,
      });

      const marginAtRisk = Math.abs(
        marginAtRiskResult[0]?.totalMarginAtRisk || 0
      );

      // Get recommendations by type
      const recommendationsByType = await PriceRecommendation.findAll({
        attributes: [
          "recommendation_type",
          [models.Sequelize.fn("COUNT", models.Sequelize.col("id")), "count"],
        ],
        where: { status: "PENDING" },
        group: ["recommendation_type"],
        raw: true,
      });

      const typeCounts = {};
      recommendationsByType.forEach((item) => {
        typeCounts[item.recommendation_type] = parseInt(item.count);
      });

      // Get recommendations by priority
      const recommendationsByPriority = await PriceRecommendation.findAll({
        attributes: [
          "priority",
          [models.Sequelize.fn("COUNT", models.Sequelize.col("id")), "count"],
        ],
        where: { status: "PENDING" },
        group: ["priority"],
        raw: true,
      });

      const priorityCounts = {};
      recommendationsByPriority.forEach((item) => {
        priorityCounts[item.priority] = parseInt(item.count);
      });

      // Get top recommendations
      const topRecommendations = await PriceRecommendation.findAll({
        attributes: [
          "id",
          "product_id",
          "species_id",
          "recommendation_type",
          "priority",
          "expected_margin_impact",
          "confidence_score",
          "status",
        ],
        include: [
          {
            model: models.ProductMaster,
            as: "product",
            required: false,
            attributes: ["id", "product_name", "hsn_code"], // Use id instead of product_code
          },
          {
            model: models.SpeciesMaster,
            as: "species",
            required: false,
            attributes: ["id", "species_name"],
          },
        ],
        where: { status: "PENDING" },
        order: [["expected_margin_impact", "ASC"]], // Most negative impact first
        limit: 5,
        raw: true,
        nest: true,
      });

      // Get critical recommendations count
      const criticalCount = await PriceRecommendation.count({
        where: {
          status: "PENDING",
          priority: "CRITICAL",
        },
      });

      // Calculate average confidence
      const avgConfidenceResult = await PriceRecommendation.findAll({
        attributes: [
          [
            models.Sequelize.fn(
              "AVG",
              models.Sequelize.col("confidence_score")
            ),
            "avgConfidence",
          ],
        ],
        where: { status: "PENDING" },
        raw: true,
      });

      const avgConfidence = (avgConfidenceResult[0]?.avgConfidence || 0) * 100;

      return reply.send({
        success: true,
        data: {
          marginAtRisk,
          recommendationsByType: typeCounts,
          recommendationsByPriority: priorityCounts,
          topRecommendations,
          criticalRecommendations: criticalCount,
          avgConfidence: Math.round(avgConfidence * 10) / 10,
          totalRecommendations: await PriceRecommendation.count({
            where: { status: "PENDING" },
          }),
        },
      });
    } catch (error) {
      console.error("Error fetching CFO dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch CFO dashboard data",
        details: error.message,
      });
    }
  }

  /**
   * Get Sales Dashboard Data
   */
  async getSalesDashboard(req, reply) {
    try {
      const { PriceRecommendation } = models;

      // Get discount warnings
      const discountWarnings = await PriceRecommendation.findAll({
        where: {
          recommendation_type: "DISCOUNT_WARNING",
          status: "PENDING",
        },
        include: [
          { model: models.ProductMaster, as: "product", required: false },
          { model: models.SpeciesMaster, as: "species", required: false },
        ],
        raw: true,
        nest: true,
      });

      // Get price increase recommendations
      const priceIncreases = await PriceRecommendation.findAll({
        where: {
          recommendation_type: "PRICE_INCREASE",
          status: "PENDING",
        },
        include: [
          { model: models.ProductMaster, as: "product", required: false },
          { model: models.SpeciesMaster, as: "species", required: false },
        ],
        raw: true,
        nest: true,
      });

      // Calculate customer elasticity insights
      const elasticityInsights = {
        highElasticityCustomers: discountWarnings.length,
        priceIncreaseOpportunities: priceIncreases.length,
        avgDiscountRisk:
          discountWarnings.reduce(
            (sum, rec) => sum + (rec.reason_details?.avg_discount_pct || 0),
            0
          ) / (discountWarnings.length || 1),
        totalPotentialMarginGain: priceIncreases.reduce(
          (sum, rec) => sum + (rec.expected_margin_impact || 0),
          0
        ),
      };

      return reply.send({
        success: true,
        data: {
          discountWarnings,
          priceIncreases,
          elasticityInsights,
          recommendations: [...discountWarnings, ...priceIncreases],
        },
      });
    } catch (error) {
      console.error("Error fetching sales dashboard:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch sales dashboard data",
        details: error.message,
      });
    }
  }

  /**
   * Export recommendations to CSV
   */
  async exportRecommendations(req, reply) {
    try {
      const { PriceRecommendation } = models;

      const recommendations = await PriceRecommendation.findAll({
        include: [
          { model: models.ProductMaster, as: "product", required: false },
          { model: models.SpeciesMaster, as: "species", required: false },
        ],
        where: { status: "PENDING" },
        order: [
          ["priority", "DESC"],
          ["expected_margin_impact", "ASC"],
        ],
        raw: true,
        nest: true,
      });

      // Generate CSV
      const csvHeaders = [
        "SKU Code",
        "Product Name",
        "Species",
        "Recommendation Type",
        "Current Price",
        "Recommended Price",
        "Price Change %",
        "Expected Margin Impact",
        "Confidence Score",
        "Risk Score",
        "Priority",
        "Market",
        "Reason Code",
      ];

      const csvData = recommendations.map((rec) => [
        rec.sku_code,
        rec.product?.product_name || "",
        rec.species?.species_name || "",
        rec.recommendation_type.replace("_", " "),
        rec.current_price,
        rec.recommended_price || "",
        rec.price_change_pct || "",
        rec.expected_margin_impact || "",
        `${(rec.confidence_score * 100).toFixed(1)}%`,
        `${(rec.risk_score * 100).toFixed(1)}%`,
        rec.priority,
        rec.market,
        rec.reason_code,
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      return reply
        .header("Content-Type", "text/csv")
        .header(
          "Content-Disposition",
          'attachment; filename="price-recommendations.csv"'
        )
        .send(csvContent);
    } catch (error) {
      console.error("Error exporting recommendations:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to export recommendations",
        details: error.message,
      });
    }
  }

  /**
   * Generate yield vs price heatmap data
   */
  async generateYieldPriceHeatmap(market, speciesId) {
    const { ProfitabilityFact } = models;

    const data = await ProfitabilityFact.findAll({
      attributes: [
        [
          models.Sequelize.literal(`
          CASE
            WHEN yield_loss_cost > 0 THEN ROUND((yield_loss_cost / (net_revenue + yield_loss_cost)) * 100, 1)
            ELSE 0
          END
        `),
          "yield_loss_pct",
        ],
        [
          models.Sequelize.literal(
            "ROUND(net_revenue / NULLIF(volume_kg, 0), 2)"
          ),
          "price_per_kg",
        ],
        [
          models.Sequelize.fn("AVG", models.Sequelize.col("gross_margin_pct")),
          "avg_margin_pct",
        ],
        [
          models.Sequelize.fn("COUNT", models.Sequelize.col("id")),
          "transaction_count",
        ],
        [
          models.Sequelize.fn("SUM", models.Sequelize.col("gross_margin")),
          "total_margin",
        ],
      ],
      where: {
        market: market || "DOMESTIC",
        ...(speciesId && { species_id: speciesId }),
      },
      group: [
        models.Sequelize.literal(`
          CASE
            WHEN yield_loss_cost > 0 THEN ROUND((yield_loss_cost / (net_revenue + yield_loss_cost)) * 100, 1)
            ELSE 0
          END
        `),
        models.Sequelize.literal(
          "ROUND(net_revenue / NULLIF(volume_kg, 0), 2)"
        ),
      ],
      having: models.Sequelize.literal("COUNT(id) >= 5"),
      order: [
        ["yield_loss_pct", "ASC"],
        ["price_per_kg", "ASC"],
      ],
      raw: true,
    });

    return {
      data: data,
      metadata: {
        totalDataPoints: data.length,
        market: market || "DOMESTIC",
        speciesFilter: speciesId || "All Species",
      },
    };
  }
}

module.exports = PriceRecommendationController;
