const PricingController = require("../controllers/PricingController.js");

const pricingController = new PricingController();

module.exports = async function pricingRoutes(fastify, options) {
  // Calculate batch price
  fastify.post("/api/pricing/calculate", {
    schema: {
      description: "Calculate yield-based price for a batch",
      tags: ["Pricing"],
      body: {
        type: "object",
        required: [
          "batchId",
          "productForm",
          "market",
          "processType",
          "rawCostPerKg",
          "expectedYieldPct",
          "actualYieldPct",
          "gstRatePct",
        ],
        properties: {
          batchId: { type: "string", description: "Procurement batch ID" },
          productForm: {
            type: "string",
            enum: ["FROZEN", "COOKED", "FRESH"],
            description: "Product form",
          },
          market: {
            type: "string",
            enum: ["DOMESTIC", "EXPORT"],
            description: "Target market",
          },
          processType: {
            type: "string",
            enum: ["WHOLE", "FILLET", "STEAK", "MINCE"],
            description: "Processing type",
          },
          rawCostPerKg: {
            type: "number",
            minimum: 0,
            description: "Raw material cost per kg",
          },
          expectedYieldPct: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Expected yield percentage",
          },
          actualYieldPct: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Actual yield percentage",
          },
          gstRatePct: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "GST rate percentage",
          },
          yieldLossCostPerKg: {
            type: "number",
            minimum: 0,
            description: "Yield loss cost per kg (optional)",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            priceSnapshot: { type: "object" },
            calculation: { type: "object" },
            message: { type: "string" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: pricingController.calculateBatchPrice.bind(pricingController),
  });

  // Get pricing history for a batch
  fastify.get("/api/pricing/history/:batchId", {
    schema: {
      description: "Get pricing history for a batch",
      tags: ["Pricing"],
      params: {
        type: "object",
        required: ["batchId"],
        properties: {
          batchId: { type: "string", description: "Procurement batch ID" },
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
    handler: pricingController.getBatchPricingHistory.bind(pricingController),
  });

  // Apply price override
  fastify.post("/api/pricing/override/:snapshotId", {
    schema: {
      description: "Apply price override with approval",
      tags: ["Pricing"],
      params: {
        type: "object",
        required: ["snapshotId"],
        properties: {
          snapshotId: { type: "string", description: "Price snapshot ID" },
        },
      },
      body: {
        type: "object",
        required: ["reason", "price"],
        properties: {
          reason: { type: "string", description: "Override reason" },
          price: {
            type: "number",
            minimum: 0,
            description: "Override price ex-GST",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            snapshot: { type: "object" },
            message: { type: "string" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: pricingController.applyPriceOverride.bind(pricingController),
  });

  // Approve or reject price snapshot
  fastify.post("/api/pricing/approve/:snapshotId", {
    schema: {
      description: "Approve or reject price snapshot",
      tags: ["Pricing"],
      params: {
        type: "object",
        required: ["snapshotId"],
        properties: {
          snapshotId: { type: "string", description: "Price snapshot ID" },
        },
      },
      body: {
        type: "object",
        required: ["action"],
        properties: {
          action: {
            type: "string",
            enum: ["APPROVE", "REJECT"],
            description: "Approval action",
          },
          reason: {
            type: "string",
            description: "Rejection reason (required if rejecting)",
          },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            snapshot: { type: "object" },
            message: { type: "string" },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: pricingController.approveOrRejectPrice.bind(pricingController),
  });

  // Get price snapshot details
  fastify.get("/api/pricing/snapshot/:snapshotId", {
    schema: {
      description: "Get price snapshot details",
      tags: ["Pricing"],
      params: {
        type: "object",
        required: ["snapshotId"],
        properties: {
          snapshotId: { type: "string", description: "Price snapshot ID" },
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
    handler: pricingController.getPriceSnapshot.bind(pricingController),
  });

  // Get pending approvals
  fastify.get("/api/pricing/pending-approvals", {
    schema: {
      description: "Get pending price approvals",
      tags: ["Pricing"],
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
    handler: pricingController.getPendingApprovals.bind(pricingController),
  });

  // Get pricing analytics
  fastify.get("/api/pricing/analytics", {
    schema: {
      description: "Get pricing analytics and insights",
      tags: ["Pricing"],
      querystring: {
        type: "object",
        properties: {
          speciesId: { type: "string", description: "Filter by species ID" },
          productForm: {
            type: "string",
            enum: ["FROZEN", "COOKED", "FRESH"],
            description: "Filter by product form",
          },
          market: {
            type: "string",
            enum: ["DOMESTIC", "EXPORT"],
            description: "Filter by market",
          },
          status: {
            type: "string",
            enum: ["CALCULATED", "APPROVED", "REJECTED", "EXPIRED"],
            description: "Filter by status",
          },
          startDate: {
            type: "string",
            format: "date",
            description: "Start date for filtering",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date for filtering",
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
    handler: pricingController.getPricingAnalytics.bind(pricingController),
  });
};
