export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["size"],
      properties: {
        size: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
