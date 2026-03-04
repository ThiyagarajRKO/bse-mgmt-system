export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["product_category_master_id", "product_category_master_data"],
      properties: {
        product_category_master_id: { type: "string" },
        product_category_master_data: { type: "object" },
      },
    },
  },
};
