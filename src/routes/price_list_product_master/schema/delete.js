export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["price_list_product_master_id"],
      properties: {
        price_list_product_master_id: { type: "string" },
      },
    },
  },
};
