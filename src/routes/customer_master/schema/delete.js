export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["customer_master_id"],
      properties: {
        customer_master_id: { type: "string" },
      },
    },
  },
};
