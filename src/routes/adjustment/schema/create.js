export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "procurement_id",
        "adjustment_adjusted_quantity",
        "adjustment_adjusted_price",
        "adjustment_reason",
        "adjustment_surveyor",
      ],
      properties: {
        adjustment_adjusted_quantity: { type: "integer" },
        adjustment_adjusted_price: { type: "integer" },
        adjustment_reason: { type: "string" },
        adjustment_surveyor: { type: "string" },
        procurement_id: { type: "string" },
      },
    },
  },
};
