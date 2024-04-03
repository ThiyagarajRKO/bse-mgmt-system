export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "procurement_lot_id",
        "product_master_id",
        "procurement_product_type",
        "procurement_quantity",
        "procurement_price",
        "procurement_purchaser",
      ],
      properties: {
        procurement_lot_id: { type: "string" },
        product_master_id: { type: "string" },
        procurement_product_type: { type: "string" },
        procurement_quantity: { type: "integer" },
        procurement_price: { type: "integer" },
        procurement_purchaser: { type: "string" },
      },
    },
  },
};
