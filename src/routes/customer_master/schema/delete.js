export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["customer_master_id"],
      properties: {
        customer_master_id: { type: "string" },
      },
    },
  },
};
