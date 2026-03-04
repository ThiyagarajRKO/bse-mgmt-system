export const allocateStockSchema = {
  schema: {
    body: {
      type: "object",
      required: ["order_id", "product_id"],
      properties: {
        order_id: { type: "string" },
        product_id: { type: "string" },
      },
    },
  },
};
