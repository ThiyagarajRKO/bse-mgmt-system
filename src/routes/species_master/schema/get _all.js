export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        species_name: { type: "string" },
        species_code: { type: "string" },
        scientific_name: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
