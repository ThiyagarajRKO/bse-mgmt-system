export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["order_product_id"],
      properties: {
        order_product_id: { type: "string" },
      },
    },
  },
};
