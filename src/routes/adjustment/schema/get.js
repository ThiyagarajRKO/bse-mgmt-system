export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["adjustment_id"],
      properties: {
        adjustment_id: { type: "string" },
      },
    },
  },
};
