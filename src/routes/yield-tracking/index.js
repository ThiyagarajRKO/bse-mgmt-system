import YieldTrackingController from "../../controllers/yield_tracking.js";

// Schema definitions
const createYieldStandardSchema = {
  body: {
    type: "object",
    required: [
      "species_id",
      "product_form",
      "processing_type",
      "expected_yield_pct",
    ],
    properties: {
      species_id: { type: "string" },
      product_form: {
        type: "string",
        enum: ["FROZEN", "COOKED", "RTE", "FRESH"],
      },
      processing_type: { type: "string" },
      expected_yield_pct: { type: "number", minimum: 0, maximum: 100 },
      allowed_variance_pct: {
        type: "number",
        minimum: 0,
        maximum: 50,
        default: 2.0,
      },
    },
  },
};

const captureYieldSchema = {
  body: {
    type: "object",
    required: ["packing_list_id"],
    properties: {
      packing_list_id: { type: "string" },
    },
  },
};

const getYieldDashboardSchema = {
  querystring: {
    type: "object",
    required: ["start_date", "end_date"],
    properties: {
      start_date: { type: "string", format: "date" },
      end_date: { type: "string", format: "date" },
      species_id: { type: "string" },
    },
  },
};

const getYieldActualSchema = {
  querystring: {
    type: "object",
    properties: {
      packing_list_id: { type: "string" },
      species_id: { type: "string" },
      status: { type: "string", enum: ["OK", "WARNING", "BREACH"] },
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
  },
};

export const yieldTrackingRoutes = (fastify, opts, done) => {
  // Create yield standard
  fastify.post(
    "/standards",
    {
      schema: createYieldStandardSchema,
      preHandler: fastify.authenticate,
    },
    YieldTrackingController.createYieldStandard
  );

  // Get yield standards
  fastify.get(
    "/standards",
    {
      preHandler: fastify.authenticate,
    },
    YieldTrackingController.getYieldStandards
  );

  // Capture yield after packing list finalization
  fastify.post(
    "/capture",
    {
      schema: captureYieldSchema,
      preHandler: fastify.authenticate,
    },
    YieldTrackingController.captureYield
  );

  // Get yield dashboard data
  fastify.get(
    "/dashboard",
    {
      schema: getYieldDashboardSchema,
      preHandler: fastify.authenticate,
    },
    YieldTrackingController.getYieldDashboard
  );

  // Get yield actual records
  fastify.get(
    "/actual",
    {
      schema: getYieldActualSchema,
      preHandler: fastify.authenticate,
    },
    YieldTrackingController.getYieldActual
  );

  done();
};
