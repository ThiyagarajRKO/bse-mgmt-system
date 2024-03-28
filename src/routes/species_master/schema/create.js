export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "division_master_id",
        "species_code",
        "species_name",
        "scientific_name",
      ],
      properties: {
        division_master_id: { type: "string" },
        species_code: { type: "string" },
        species_name: { type: "string" },
        scientific_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
