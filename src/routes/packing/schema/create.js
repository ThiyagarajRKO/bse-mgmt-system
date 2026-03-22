export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "unit_master_id",
        "packing_quantity",
        "packaging_master_id",
        "expiry_date",
        "packing_notes",
      ],
      properties: {
        peeled_dispatch_id: { type: "string" }, // Optional - for processed products
        dispatch_id: { type: "string" }, // Optional - for unprocessed products (Dispatch → Packing directly)
        unit_master_id: { type: "string" },
        packing_quantity: { type: "string" },
        grade_master_id: { type: "string" }, // Made optional - will be derived from product
        size_master_id: { type: "string" }, // Made optional - will be derived from product
        packaging_master_id: { type: "string" },
        expiry_date: { type: "string" },
        packing_notes: { type: "string" },
      },
    },
  },
};
