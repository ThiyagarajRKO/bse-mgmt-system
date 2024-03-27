export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_grade_master_id"],
      properties: {
        species_grade_master_id: { type: "string" },
      },
    },
  },
};
