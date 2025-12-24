const ProfitabilityController = require("../controllers/ProfitabilityController.js");

const profitabilityController = new ProfitabilityController();

export default async function profitabilityRoutes(fastify, options) {
  // Calculate profitability for posted invoice
  fastify.post("/api/profitability/calculate", {
    schema: {
      description: "Calculate profitability for a posted invoice",
      tags: ["Profitability"],
      body: {
        type: "object",
        required: [
          "invoiceId",
          "customerId",
          "market",
          "postingDate",
          "lineItems",
        ],
        properties: {
          invoiceId: { type: "string", description: "Posted invoice ID" },
          customerId: { type: "string", description: "Customer ID" },
          market: {
            type: "string",
            enum: ["DOMESTIC", "EXPORT"],
            description: "Market segment",
          },
          postingDate: {
            type: "string",
            format: "date",
            description: "Invoice posting date",
          },
          lineItems: {
            type: "array",
            items: {
              type: "object",
              required: [
                "productId",
                "speciesId",
                "skuCode",
                "quantityKg",
                "netAmount",
              ],
              properties: {
                productId: { type: "string", description: "Product ID" },
                speciesId: { type: "string", description: "Species ID" },
                batchId: {
                  type: "string",
                  description: "Procurement batch ID",
                },
                skuCode: { type: "string", description: "SKU code" },
                quantityKg: {
                  type: "number",
                  minimum: 0,
                  description: "Quantity in kg",
                },
                netAmount: {
                  type: "number",
                  minimum: 0,
                  description: "Net revenue amount",
                },
                discountAmount: {
                  type: "number",
                  minimum: 0,
                  description: "Discount applied",
                },
                gradeId: {
                  type: "string",
                  description: "Grade ID for packaging lookup",
                },
                sizeId: {
                  type: "string",
                  description: "Size ID for packaging lookup",
                },
              },
            },
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            recordsProcessed: { type: "number" },
            alertsGenerated: { type: "number" },
            processingTimeMs: { type: "number" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.calculateInvoiceProfitability.bind(
      profitabilityController
    ),
  });

  // Get species profitability analysis
  fastify.get("/api/profitability/species", {
    schema: {
      description: "Get profitability analysis by species",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date filter",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date filter",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getSpeciesProfitability.bind(
      profitabilityController
    ),
  });

  // Get customer margin ranking
  fastify.get("/api/profitability/customers", {
    schema: {
      description: "Get customer profitability ranking",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date filter",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date filter",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getCustomerMarginRanking.bind(
      profitabilityController
    ),
  });

  // Get SKU profitability analysis (identifies killers)
  fastify.get("/api/profitability/skus", {
    schema: {
      description: "Get unprofitable SKU analysis",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date filter",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date filter",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
            message: { type: "string" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getSKUProfitability.bind(
      profitabilityController
    ),
  });

  // Get active alerts
  fastify.get("/api/profitability/alerts", {
    schema: {
      description: "Get active profitability alerts",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          severity: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            description: "Filter by severity",
          },
          alertType: {
            type: "string",
            enum: [
              "MARGIN_BELOW_MINIMUM",
              "MARGIN_DROP_WOW",
              "YIELD_LOSS_EXCESSIVE",
              "DISCOUNT_EXCEEDS_MARGIN",
              "NEGATIVE_MARGIN",
            ],
            description: "Filter by alert type",
          },
          limit: {
            type: "number",
            minimum: 1,
            maximum: 1000,
            description: "Maximum number of alerts to return",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
            count: { type: "number" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getActiveAlerts.bind(
      profitabilityController
    ),
  });

  // Acknowledge alert
  fastify.post("/api/profitability/alerts/:alertId/acknowledge", {
    schema: {
      description: "Acknowledge a profitability alert",
      tags: ["Profitability"],
      params: {
        type: "object",
        required: ["alertId"],
        properties: {
          alertId: { type: "string", description: "Alert ID to acknowledge" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
            message: { type: "string" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.acknowledgeAlert.bind(
      profitabilityController
    ),
  });

  // Get profitability drilldown
  fastify.get("/api/profitability/drilldown/:profitabilityId", {
    schema: {
      description: "Get detailed profitability breakdown for a specific record",
      tags: ["Profitability"],
      params: {
        type: "object",
        required: ["profitabilityId"],
        properties: {
          profitabilityId: {
            type: "string",
            description: "Profitability fact ID",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getProfitabilityDrilldown.bind(
      profitabilityController
    ),
  });

  // Get dashboard summary
  fastify.get("/api/profitability/dashboard", {
    schema: {
      description: "Get profitability dashboard summary",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date (defaults to 30 days ago)",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date (defaults to today)",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "object" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getDashboardSummary.bind(
      profitabilityController
    ),
  });

  // Get market analysis
  fastify.get("/api/profitability/market-analysis", {
    schema: {
      description: "Get profitability analysis by market segment",
      tags: ["Profitability"],
      querystring: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date filter",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date filter",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: { type: "array" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: profitabilityController.getMarketAnalysis.bind(
      profitabilityController
    ),
  });
}
