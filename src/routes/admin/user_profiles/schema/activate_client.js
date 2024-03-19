export const reactivateProfilesSchema = {
  schema: {
    body: {
      type: "object",
      required: ["user_id"],
      properties: {
        user_id: { type: "string" },
      },
    },
  },
};
