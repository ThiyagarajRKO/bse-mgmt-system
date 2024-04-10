export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "peeling_id",
        "product_master_id",
        "yield_quantity",
        "peeling_notes",
      ],
      properties: {
        peeling_id: { type: "string" },
        product_master_id: { type: "string" },
        yield_quantity: { type: "string" },
        peeling_notes: { type: "string" },
      },
    },
  },
};
