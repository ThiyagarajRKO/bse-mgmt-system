export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeling_product_id", "peeling_product_data"],
      properties: {
        peeling_product_id: { type: "string" },
        peeling_product_data: { type: "object" },
      },
    },
  },
};
