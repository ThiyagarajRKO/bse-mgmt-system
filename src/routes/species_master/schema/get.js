export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["species_master_id", "species_code"],
      properties: {
        species_master_id: { type: "string" },
        species_code: { type: "string" },
      },
    },
  },
};
