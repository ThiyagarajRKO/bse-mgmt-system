export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["grade_name", "species_master_id"],
      properties: {
        grade_name: { type: "string" },
        description: { type: "string" },
        species_master_id: { type: "string" },
      },
    },
  },
};
