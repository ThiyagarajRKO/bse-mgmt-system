export const profileInfoSchema = {
  schema: {
    query: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: { type: "string" },
      },
    },
  },
};
