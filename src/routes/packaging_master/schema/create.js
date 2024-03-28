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
        packaging_height: { type: "integer" },
        packaging_width: { type: "integer" },
        packaging_length: { type: "integer" },
        packaging_weight: { type: "integer" },
        packaging_material_composition: { type: "string" },
        vendor_master_id: { type: "string" },
      },
    },
  },
};
