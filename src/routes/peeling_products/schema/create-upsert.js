export const bulkCreateOrUpdateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeling_product_data"],
      properties: {
        peeling_product_data: { type: "array" },
      },
    },
  },
};
