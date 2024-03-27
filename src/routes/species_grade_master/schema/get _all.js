export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        species_grade_name: { type: "string" },
        species_master_name: { type: "string" },
        species_master_code: { type: "string" },
      },
    },
  },
};
