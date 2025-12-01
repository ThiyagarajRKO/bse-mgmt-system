export const signInSchema = {
  schema: {
    body: {
      type: "object",
      required: ["password", "role_id"],
      properties: {
        username: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        password: { type: "string" },
        role_id: { type: "string" },
      },
    },
  },
};
