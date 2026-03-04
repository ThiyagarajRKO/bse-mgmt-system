export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_master_id", "product_category"],
      properties: {
        species_master_id: { type: "string" },
        product_category: { type: "string" },
      },
    },
  },
};
