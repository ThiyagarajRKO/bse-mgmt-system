export const getNamesSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        dispatch_id: { type: "string" },
        procurement_lot_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
