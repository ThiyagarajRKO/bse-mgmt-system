export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["grade_name"],
      properties: {
        grade_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
