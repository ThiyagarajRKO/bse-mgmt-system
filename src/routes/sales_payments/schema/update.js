export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["purchase_payment_id", "purchase_payment_data"],
      properties: {
        purchase_payment_id: { type: "string" },
        purchase_payment_data: { type: "object" },
      },
    },
  },
};
