export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "packaging_type",
        "packaging_height",
        "packaging_width",
        "packaging_length",
        "packaging_material_composition",
        "packaging_supplier",
      ],
      properties: {
        packaging_type: { type: "string" },
        packaging_height: { type: "integer" },
        packaging_width: { type: "integer" },
        packaging_length: { type: "integer" },
        packaging_material_composition: { type: "string" },
        packaging_supplier: { type: "string" },
      },
    },
  },
};
