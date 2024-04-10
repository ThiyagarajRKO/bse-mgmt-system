export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeling_product_id"],
      properties: {
        peeling_product_id: { type: "string" },
      },
    },
  },
};
