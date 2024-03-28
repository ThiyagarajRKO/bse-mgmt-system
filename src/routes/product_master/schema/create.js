export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["size_master_ids"],
      properties: {
        size_master_ids: { type: "array" },
        species_master_id: { type: "string" },
        product_category_master_id: { type: "string" },
        product_category: { type: "string" },
      },
    },
  },
};
