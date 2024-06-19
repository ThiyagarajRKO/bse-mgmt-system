export const getPaidStatusSchema = {
  schema: {
    query: {
      type: "object",
      required: ["procurement_product_id", "supplier_master_id"],
      properties: {
        procurement_product_id: { type: "string" },
        supplier_master_id: { type: "string" },
      },
    },
  },
};
