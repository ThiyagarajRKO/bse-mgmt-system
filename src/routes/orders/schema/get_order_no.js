export const getOrderNumbersSchema = {
  schema: {
    query: {
      type: "object",
      required: ["customer_master_id"],
      properties: {
        customer_master_id: { type: "string" },
        sales_payment_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
        search: { type: "string" },
      },
    },
  },
};
