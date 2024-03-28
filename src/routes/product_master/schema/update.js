export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["product_master_id", "product_master_data"],
      properties: {
        product_master_id: { type: "string" },
        product_master_data: { type: "object" },
      },
    },
  },
};
