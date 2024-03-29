export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["product_category_master_id"],
      properties: {
        product_category_master_id: { type: "string" },
      },
    },
  },
};
