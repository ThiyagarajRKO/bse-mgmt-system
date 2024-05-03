export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["customer_master_id", "customer_master_data"],
      properties: {
        customer_master_id: { type: "string" },
        customer_master_data: { type: "object" },
      },
    },
  },
};
