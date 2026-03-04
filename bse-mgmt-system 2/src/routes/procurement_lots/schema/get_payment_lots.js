export const getPaymentLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: ["supplier_master_id"],
      properties: {
        supplier_master_id: { type: "string" },
        purchase_payment_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
