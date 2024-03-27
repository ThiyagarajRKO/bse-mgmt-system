export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_master_id", "species_master_data"],
      properties: {
        species_master_id: { type: "string" },
        species_master_data: { type: "object" },
      },
    },
  },
};
