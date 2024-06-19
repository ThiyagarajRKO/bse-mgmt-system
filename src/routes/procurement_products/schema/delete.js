export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["supplier_master_id"],
      properties: {
        procurement_lot_id: { type: "string" },
        procurement_product_id: { type: "string" },
        supplier_master_id: { type: "string" },
      },
    },
  },
};
