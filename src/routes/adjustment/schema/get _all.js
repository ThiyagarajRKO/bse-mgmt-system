export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        adjustment_lot: { type: "string" },
        adjustment_product: { type: "string" },
        adjustment_actual_quantity: { type: "integer" },
        adjustment_adjusted_quantity: { type: "integer" },
        adjustment_actual_price: { type: "integer" },
        adjustment_adjusted_price: { type: "integer" },
        adjustment_reason: { type: "string" },
        adjustment_surveyor: { type: "string" },
      },
    },
  },
};
