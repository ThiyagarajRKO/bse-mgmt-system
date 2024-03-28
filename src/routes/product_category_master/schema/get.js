export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["product_category_master_id"],
      properties: {
        product_category_master_id: { type: "string" },
      },
    },
  },
};
