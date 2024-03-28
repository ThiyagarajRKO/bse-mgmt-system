export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["product_master_id"],
      properties: {
        product_master_id: { type: "string" },
      },
    },
  },
};
