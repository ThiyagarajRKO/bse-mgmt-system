export const signInSchema = {
  schema: {
    body: {
      type: "object",
      required: ["identity", "password"],
      properties: {
        identity: { type: "string" },
        password: { type: "string" },
        role_id: { type: "string" },
      },
    },
  },
};
