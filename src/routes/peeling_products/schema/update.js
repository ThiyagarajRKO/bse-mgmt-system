export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeled_product_id", "peeling_product_data"],
      properties: {
        peeled_product_id: { type: "string" },
        peeling_product_data: { type: "object" },
      },
    },
  },
};
