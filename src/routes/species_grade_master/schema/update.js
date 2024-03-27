export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_grade_master_id", "species_grade_master_data"],
      properties: {
        species_grade_master_id: { type: "string" },
        species_grade_master_data: { type: "object" },
      },
    },
  },
};
