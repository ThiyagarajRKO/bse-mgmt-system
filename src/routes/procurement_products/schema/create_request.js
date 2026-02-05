export const createRequestSchema = {
  schema: {
    body: {
      type: "object",
      required: ["order_id", "product_id", "supplier_id", "quantity"],
      properties: {
        order_id: { type: "string" },
        product_id: { type: "string" },
        supplier_id: { type: "string" },
        quantity: { type: "number" },
        remarks: { type: "string" },
      },
    },
  },
};
