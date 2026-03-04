export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["grade_master_id"],
      properties: {
        grade_master_id: { type: "string" },
      },
    },
  },
};
