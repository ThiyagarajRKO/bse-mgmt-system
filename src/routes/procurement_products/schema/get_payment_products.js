export const getPaymentItemsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        purchase_payment_id: { type: "string" },
        supplier_master_id: { type: "string" },
        start: { type: "string" },
        length: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
