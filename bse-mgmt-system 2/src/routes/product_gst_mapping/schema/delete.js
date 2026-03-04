export const deleteSchema = {
  schema: {
    querystring: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
      },
    },
  },
};
