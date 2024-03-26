export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        packaging_code: { type: "string" },
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
