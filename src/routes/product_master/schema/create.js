export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["size_master_id", "product_category_master_id"],
      properties: {
        size_master_id: { type: "string" },
        product_category_master_id: { type: "string" },
      },
    },
  },
};
