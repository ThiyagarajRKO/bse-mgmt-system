export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "packaging_type",
        "packaging_material_composition",
        "vendor_master_id",
      ],
      properties: {
        packaging_type: { type: "string" },
        packaging_height: { type: "string" },
        packaging_width: { type: "string" },
        packaging_length: { type: "string" },
        packaging_weight: { type: "string" },
        packaging_material_composition: { type: "string" },
        vendor_master_id: { type: "string" },
      },
    },
  },
};
