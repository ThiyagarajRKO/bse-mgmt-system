export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["species_grade_master_id"],
      properties: {
        species_grade_master_id: { type: "string" },
      },
    },
  },
};
