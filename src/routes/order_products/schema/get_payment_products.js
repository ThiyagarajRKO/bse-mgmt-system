export const getPaymentItemsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        sales_payment_id: { type: "string" },
        customer_master_id: { type: "string" },
        start: { type: "string" },
        length: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
