export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["grade_master_id", "grade_master_data"],
      properties: {
        grade_master_id: { type: "string" },
        grade_master_data: { type: "object" },
      },
    },
  },
};
