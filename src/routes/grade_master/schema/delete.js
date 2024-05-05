export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["grade_master_id"],
      properties: {
        grade_master_id: { type: "string" },
      },
    },
  },
};
