export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["peeling_product_id"],
      properties: {
        peeling_product_id: { type: "string" },
      },
    },
  },
};
