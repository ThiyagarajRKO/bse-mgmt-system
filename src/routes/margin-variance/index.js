import MarginVarianceController from "../../controllers/margin_variance.js";

// Schema definitions
const processMarginVarianceSchema = {
  body: {
    type: "object",
    required: ["invoice_id"],
    properties: {
      invoice_id: { type: "string" },
    },
  },
};

const approveMarginVarianceSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      notes: { type: "string" },
    },
  },
};

const postToGLSchema = {
  body: {
    type: "object",
    required: ["invoice_id"],
    properties: {
      invoice_id: { type: "string" },
    },
  },
};

const getMarginVarianceReportSchema = {
  querystring: {
    type: "object",
    required: ["start_date", "end_date"],
    properties: {
      start_date: { type: "string", format: "date" },
      end_date: { type: "string", format: "date" },
      species_id: { type: "string" },
      status: { type: "string", enum: ["OK", "WARNING", "BREACH"] },
    },
  },
};

const getMarginVariancesByInvoiceSchema = {
  params: {
    type: "object",
    required: ["invoice_id"],
    properties: {
      invoice_id: { type: "string" },
    },
  },
};

export const marginVarianceRoutes = (fastify, opts, done) => {
  // Process margin variance for finalized invoice
  fastify.post(
    "/process",
    {
      schema: processMarginVarianceSchema,
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.processMarginVariance
  );

  // Approve margin variance (for BREACH cases)
  fastify.put(
    "/:id/approve",
    {
      schema: approveMarginVarianceSchema,
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.approveMarginVariance
  );

  // Post margin variance to GL
  fastify.post(
    "/post-to-gl",
    {
      schema: postToGLSchema,
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.postToGL
  );

  // Get margin variance report
  fastify.get(
    "/report",
    {
      schema: getMarginVarianceReportSchema,
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.getMarginVarianceReport
  );

  // Get margin variances by invoice
  fastify.get(
    "/invoice/:invoice_id",
    {
      schema: getMarginVariancesByInvoiceSchema,
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.getMarginVariancesByInvoice
  );

  // Get pending approvals (BREACH cases needing supervisor approval)
  fastify.get(
    "/pending-approvals",
    {
      preHandler: fastify.authenticate,
    },
    MarginVarianceController.getPendingApprovals
  );

  done();
};
