export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "species_master_id",
        "product_name",
        "product_short_code",
        "size_master_ids",
      ],
      properties: {
        species_master_id: { type: "string" },
        product_name: { type: "string" },
        product_short_code: { type: "string" },
        size_master_ids: { type: "array" },
      },
    },
  },
};
