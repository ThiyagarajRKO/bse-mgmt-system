export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "packaging_name",
        "packaging_type",
        "packaging_height",
        "packaging_width",
        "packaging_length",
        "package_material_composition",
        "package_supplier",
      ],
      properties: {
        packaging_name: { type: "string" },
        packaging_type: { type: "string" },
        packaging_height: { type: "string" },
        packaging_width: { type: "string" },
        packaging_length: { type: "string" },
        package_material_composition: { type: "string" },
        package_supplier: { type: "string" },
      },
    },
  },
};
