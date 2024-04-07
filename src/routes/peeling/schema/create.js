export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "dispatch_id",
        "unit_master_id",
        "product_master_id",
        "peeling_quantity",
        "peeling_method",
        "peeling_notes",
      ],
      properties: {
        dispatch_id: { type: "string" },
        unit_master_id: { type: "string" },
        product_master_id: { type: "string" },
        peeling_quantity: { type: "string" },
        peeling_method: { type: "string" },
        peeling_notes: { type: "string" },
      },
    },
  },
};
