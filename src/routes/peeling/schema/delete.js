export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeling_id"],
      properties: {
        peeling_id: { type: "string" },
      },
    },
  },
};
