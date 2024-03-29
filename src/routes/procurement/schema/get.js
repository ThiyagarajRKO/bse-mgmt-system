export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["procurement_id"],
      properties: {
        procurement_id: { type: "string" },
      },
    },
  },
};
