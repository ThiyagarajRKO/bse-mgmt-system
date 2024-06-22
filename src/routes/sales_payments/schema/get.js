export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["sales_payment_id"],
      properties: {
        sales_payment_id: { type: "string" },
      },
    },
  },
};
