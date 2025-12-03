export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        product_category: { type: "string" },
        species_master_name: { type: "string" },
        parent_category_type: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
