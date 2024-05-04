export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["peeling_id"],
      properties: {
        peeling_id: { type: "string" },
      },
    },
  },
};
