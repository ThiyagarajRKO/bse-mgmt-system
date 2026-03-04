export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "payment_date",
        "customer_master_id",
        "order_id",
        "payment_method",
        "total_paid",
        "net_amount",
      ],
      properties: {
        transaction_id: { type: "string" },
        payment_date: { type: "string" },
        customer_master_id: { type: "string" },
        order_id: { type: "string" },
        payment_method: { type: "string" },
        total_paid: { type: "number" },
        net_amount: { type: "number" },
        tax_percentage: { type: "number" },
        tax_amount: { type: "number" },
        due_amount: { type: "number" },
      },
    },
  },
};
