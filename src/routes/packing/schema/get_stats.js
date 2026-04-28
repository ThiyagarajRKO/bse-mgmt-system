export const getStatsSchema = {
  description: "Get Packing Statistics",
  tags: ["Packing"],
  querystring: {
    type: "object",
    properties: {
      procurement_lot_id: { type: "string" },
      "search[value]": { type: "string" },
    },
  },
  response: {
    200: {
      description: "Successful response",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              procurement_lot_id: { type: "string" },
              procurement_lot: { type: "string" },
              total_packing_count: { type: "number" },
              total_packing_quantity: { type: "number" },
              total_yield_quantity: { type: "number" },
              total_peeled_dispatched_quantity: { type: "number" },
            },
          },
        },
      },
    },
  },
};
