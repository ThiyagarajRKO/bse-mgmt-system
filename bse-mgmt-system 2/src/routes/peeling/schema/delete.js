export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["peeling_id"],
      properties: {
        peeling_id: { type: "string" },
      },
    },
  },
};
