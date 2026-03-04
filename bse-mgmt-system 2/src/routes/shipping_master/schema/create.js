export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "carrier_master_id",
        "shipping_source",
        "shipping_destination",
        "shipping_price",
        "shipping_notes",
      ],
      properties: {
        carrier_master_id: { type: "string" },
        shipping_source: { type: "string" },
        shipping_destination: { type: "string" },
        shipping_price: { type: "integer" },
        shipping_notes: { type: "string" },
      },
    },
  },
};
