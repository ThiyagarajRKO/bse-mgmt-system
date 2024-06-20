export const getPaymentLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: ["supplier_id"],
      properties: {
        supplier_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
