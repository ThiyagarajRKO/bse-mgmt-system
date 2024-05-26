export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "customer_master_id",
        "payment_terms",
        "payment_type",
        "shipping_date",
        "shipping_master_id",
        "shipping_method",
        "shipping_address",
        "expected_delivery_date",
      ],
      properties: {
        customer_master_id: { type: "string" },
        payment_terms: { type: "string" },
        payment_type: { type: "string" },
        shipping_date: { type: "string" },
        shipping_master_id: { type: "string" },
        shipping_method: { type: "string" },
        shipping_address: { type: "string" },
        expected_delivery_date: { type: "string" },
      },
    },
  },
};
