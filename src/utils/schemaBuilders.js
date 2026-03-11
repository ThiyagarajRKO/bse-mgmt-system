/**
 * Shared Schema Builders for API Routes
 * Consolidates common schema patterns like pagination, search, filters
 */

/**
 * Build base schema for product names endpoints
 * Used by: peeled_dispatches, peeling_products, dispatches
 */
export const getProductNamesSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        packing_id: { type: "string" },
        peeling_id: { type: "string" },
        procurement_lot_id: { type: "string" },
        unit_master_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};

/**
 * Build base schema for get single entity endpoints
 */
export const getSingleSchema = (entityName = "entity") => ({
  schema: {
    params: {
      type: "object",
      required: [`${entityName}_id`],
      properties: {
        [`${entityName}_id`]: { type: "string" },
      },
    },
  },
});

/**
 * Build base schema for getAll endpoints (pagination)
 */
export const getAllSchema = (requiredFields = []) => ({
  schema: {
    query: {
      type: "object",
      required: requiredFields,
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        "search[value]": { type: "string" },
      },
    },
  },
});

/**
 * Build base schema for delete endpoints
 */
export const deleteSchema = (entityName = "entity") => ({
  schema: {
    query: {
      type: "object",
      required: [`${entityName}_id`],
      properties: {
        [`${entityName}_id`]: { type: "string" },
      },
    },
  },
});

/**
 * Build standard CRUD response structure
 */
export const buildResponseStandard = (
  data,
  message = "Success",
  statusCode = 200,
) => ({
  statusCode,
  message,
  data,
});

/**
 * Build error response
 */
export const buildErrorResponse = (message, statusCode = 420) => ({
  statusCode,
  message,
});
