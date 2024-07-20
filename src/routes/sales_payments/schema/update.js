export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["sales_payment_id", "sales_payment_data"],
      properties: {
        sales_payment_id: { type: "string" },
        sales_payment_data: { type: "object" },
      },
    },
  },
};
