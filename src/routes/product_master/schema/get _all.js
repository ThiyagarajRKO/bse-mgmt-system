export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        product_category_master_id: { type: "string" },
        species_id: { type: "string" },
        product_name: { type: "string" },
        species_master_name: { type: "string" },
        product_category_name: { type: "string" },
        product_size: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
