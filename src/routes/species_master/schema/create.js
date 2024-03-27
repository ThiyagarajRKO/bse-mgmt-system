export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_name", "scientific_name"],
      properties: {
        species_code: { type: "string" },
        species_name: { type: "string" },
        scientific_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
