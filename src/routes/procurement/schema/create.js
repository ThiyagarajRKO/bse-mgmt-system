export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "procurement_date",
        "procurement_lot",
        "procurement_product_type",
        "procurement_quantity",
        "procurement_price",
        "procurement_purchaser",
        "location_master_id",
        "product_master_id",
        "vendor_master_id",
      ],
      properties: {
        procurement_date: { type: "string", format: "date" },
        procurement_lot: { type: "string" },
        procurement_product_type: { type: "string" },
        procurement_quantity: { type: "integer" },
        procurement_price: { type: "integer" },
        procurement_purchaser: { type: "string" },
        location_master_id: { type: "string" },
        product_master_id: { type: "string" },
        vendor_master_id: { type: "string" },
      },
    },
  },
};
