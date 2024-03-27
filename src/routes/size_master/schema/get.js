export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["size_master_id"],
      properties: {
        size_master_id: { type: "string" },
      },
    },
  },
};
