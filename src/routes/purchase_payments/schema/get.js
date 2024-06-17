export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["purchase_payment_id"],
      properties: {
        purchase_payment_id: { type: "string" },
      },
    },
  },
};
