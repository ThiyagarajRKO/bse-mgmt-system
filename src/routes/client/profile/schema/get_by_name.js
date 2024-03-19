export const getByNameSchema = {
  schema: {
    body: {
      type: "object",
      required: ["username"],
      properties: {
        username: { type: "string" },
      },
    },
  },
};
