export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["sales_payment_id"],
      properties: {
        sales_payment_id: { type: "string" },
      },
    },
  },
};
