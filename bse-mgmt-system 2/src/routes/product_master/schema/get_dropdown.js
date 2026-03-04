export const getDropdownSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        search: { type: "string" },
        species_id: { type: "string" },
        product_category_master_id: { type: "string" },
      },
    },
  },
};
