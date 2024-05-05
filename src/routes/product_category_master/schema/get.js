export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["product_category_master_id"],
      properties: {
        product_category_master_id: { type: "string" },
      },
    },
  },
};
