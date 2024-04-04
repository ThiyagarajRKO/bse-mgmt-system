export const countStatsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        procurement_lot_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
