export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["peeled_product_id"],
      properties: {
        peeled_product_id: { type: "string" },
      },
    },
  },
};
