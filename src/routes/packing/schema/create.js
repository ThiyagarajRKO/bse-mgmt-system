export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "peeled_dispatch_id",
        "unit_master_id",
        "packing_quantity",
        "grade_master_id",
        "size_master_id",
        "packaging_master_id",
        "packing_notes",
      ],
      properties: {
        peeled_dispatch_id: { type: "string" },
        unit_master_id: { type: "string" },
        packing_quantity: { type: "string" },
        unit_master_id: { type: "string" },
        grade_master_id: { type: "string" },
        size_master_id: { type: "string" },
        packaging_master_id: { type: "string" },
        packing_notes: { type: "string" },
      },
    },
  },
};
