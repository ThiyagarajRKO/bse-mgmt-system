export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["unit_master_id"],
      properties: {
        unit_master_id: { type: "string" },
      },
    },
  },
};
