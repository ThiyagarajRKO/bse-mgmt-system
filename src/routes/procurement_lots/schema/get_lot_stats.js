export const getStatsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        procurement_lot_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
        "search[value]": { type: "string" },
      },
    },
  },
};
