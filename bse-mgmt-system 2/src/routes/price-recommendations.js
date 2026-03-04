const PriceRecommendationController = require("../controllers/PriceRecommendationController.js");

const priceRecommendationController = new PriceRecommendationController();

// Price Recommendation Routes Schema
const priceRecommendationSchemas = {
  generateRecommendations: {
    description:
      "Generate AI-powered price recommendations based on market conditions",
    tags: ["Price Recommendations"],
    querystring: {
      type: "object",
      properties: {
        market: {
          type: "string",
          enum: ["DOMESTIC", "EXPORT"],
          description: "Market segment filter",
        },
        sku_codes: {
          type: "string",
          description: "Comma-separated SKU codes to analyze",
        },
        priority_threshold: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          description: "Minimum priority level",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sku_code: { type: "string" },
                    recommendation_type: { type: "string" },
                    current_price: { type: "number" },
                    recommended_price: { type: "number" },
                    expected_margin_impact: { type: "number" },
                    confidence_score: { type: "number" },
                    priority: { type: "string" },
                  },
                },
              },
              analysis: {
                type: "object",
                properties: {
                  totalSKUs: { type: "number" },
                  marginAtRisk: { type: "number" },
                  highPriorityCount: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  },

  getRecommendations: {
    description: "Get filtered list of price recommendations",
    tags: ["Price Recommendations"],
    querystring: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["PENDING", "APPROVED", "REJECTED", "IMPLEMENTED", "EXPIRED"],
          default: "PENDING",
        },
        priority: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        },
        recommendation_type: {
          type: "string",
          enum: [
            "PRICE_INCREASE",
            "DISCOUNT_WARNING",
            "STOP_SELL",
            "YIELD_ALERT",
          ],
        },
        market: { type: "string", enum: ["DOMESTIC", "EXPORT"] },
        sku_code: { type: "string", description: "Search by SKU code" },
        limit: { type: "integer", default: 50, minimum: 1, maximum: 200 },
        offset: { type: "integer", default: 0, minimum: 0 },
      },
    },
  },

  approveRecommendation: {
    description: "Approve or reject a price recommendation",
    tags: ["Price Recommendations"],
    params: {
      type: "object",
      properties: {
        id: { type: "string", description: "Recommendation ID" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: ["APPROVE", "REJECT"],
          description: "Approval decision",
        },
        comments: { type: "string", description: "Approval comments" },
        actual_price_change: {
          type: "number",
          description: "Actual price to implement (optional)",
        },
      },
      required: ["decision"],
    },
  },

  addFeedback: {
    description: "Add feedback and outcomes for implemented recommendation",
    tags: ["Price Recommendations"],
    params: {
      type: "object",
      properties: {
        id: { type: "string", description: "Recommendation ID" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: ["ACCEPTED", "REJECTED", "MODIFIED"],
        },
        actual_price_change: { type: "number" },
        volume_impact_actual: { type: "number" },
        margin_impact_actual: { type: "number" },
        feedback_reason: { type: "string" },
        market_feedback: { type: "object" },
        lessons_learned: { type: "string" },
      },
      required: ["decision"],
    },
  },

  cfoDashboard: {
    description:
      "Get CFO dashboard with margin risk and recommendation summary",
    tags: ["Price Recommendations", "Dashboard"],
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              marginAtRisk: { type: "number" },
              recommendationsByType: { type: "object" },
              recommendationsByPriority: { type: "object" },
              topRecommendations: { type: "array" },
            },
          },
        },
      },
    },
  },

  salesDashboard: {
    description:
      "Get sales dashboard with customer elasticity and discount risk analysis",
    tags: ["Price Recommendations", "Dashboard"],
  },

  yieldPriceHeatmap: {
    description: "Get yield vs price heatmap data for margin analysis",
    tags: ["Price Recommendations", "Analytics"],
    querystring: {
      type: "object",
      properties: {
        market: {
          type: "string",
          enum: ["DOMESTIC", "EXPORT"],
          default: "DOMESTIC",
        },
        species_id: { type: "string", description: "Filter by species ID" },
      },
    },
  },
};

// Route definitions
async function priceRecommendationRoutes(fastify, options) {
  // Generate new recommendations
  fastify.post("/generate", {
    schema: priceRecommendationSchemas.generateRecommendations,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.generateRecommendations.bind(
      priceRecommendationController
    ),
  });

  // Get recommendations list
  fastify.get("/", {
    schema: priceRecommendationSchemas.getRecommendations,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.getRecommendations.bind(
      priceRecommendationController
    ),
  });

  // Get specific recommendation
  fastify.get("/:id", {
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.getRecommendationById.bind(
      priceRecommendationController
    ),
  });

  // Approve/reject recommendation
  fastify.put("/:id/approve", {
    schema: priceRecommendationSchemas.approveRecommendation,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.approveRecommendation.bind(
      priceRecommendationController
    ),
  });

  // Implement approved recommendation
  fastify.put("/:id/implement", {
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.implementRecommendation.bind(
      priceRecommendationController
    ),
  });

  // Add feedback to recommendation
  fastify.post("/:id/feedback", {
    schema: priceRecommendationSchemas.addFeedback,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.addFeedback.bind(
      priceRecommendationController
    ),
  });

  // CFO Dashboard
  fastify.get("/cfo-dashboard", {
    schema: priceRecommendationSchemas.cfoDashboard,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.getCFODashboard.bind(
      priceRecommendationController
    ),
  });

  // Sales Dashboard
  fastify.get("/sales-dashboard", {
    schema: priceRecommendationSchemas.salesDashboard,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.getSalesDashboard.bind(
      priceRecommendationController
    ),
  });

  // Yield vs Price Heatmap
  fastify.get("/analytics/yield-price-heatmap", {
    schema: priceRecommendationSchemas.yieldPriceHeatmap,
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.getYieldPriceHeatmap.bind(
      priceRecommendationController
    ),
  });

  // Export recommendations
  fastify.get("/export", {
    preHandler: [fastify.authenticate],
    handler: priceRecommendationController.exportRecommendations.bind(
      priceRecommendationController
    ),
  });
}

module.exports = priceRecommendationRoutes;
