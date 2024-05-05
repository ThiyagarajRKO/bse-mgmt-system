export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["shipping_master_id"],
      properties: {
        shipping_master_id: { type: "string" },
      },
    },
  },
};
