export const getStatsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        procurement_lot: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
