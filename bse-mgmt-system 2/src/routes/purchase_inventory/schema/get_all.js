export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        "search[value]": { type: "string" },
        procurement_product_id: { type: "string" },
      },
    },
  },
};
