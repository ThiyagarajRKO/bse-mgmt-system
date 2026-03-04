export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["species_master_id"],
      properties: {
        species_master_id: { type: "string" },
      },
    },
  },
};
