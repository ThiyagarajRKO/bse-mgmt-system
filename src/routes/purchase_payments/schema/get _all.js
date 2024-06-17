export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        supplier_master_id: { type: "string" },
        procurement_lots: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
