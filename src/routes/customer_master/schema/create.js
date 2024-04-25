export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "customer_name",
        "customer_address",
        "customer_country",
        "customer_phone",
        "customer_email",
        "customer_credit",
        "customer_type",
      ],
      properties: {
        customer_name: { type: "string" },
        customer_address: { type: "string" },
        customer_country: { type: "string" },
        customer_phone: { type: "string" },
        customer_email: { type: "string" },
        customer_credit: { type: "string" },
        customer_type: { type: "string" },
      },
    },
  },
};
