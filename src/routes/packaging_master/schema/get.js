export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["packaging_master_id"],
      properties: {
        packaging_master_id: { type: "string" },
      },
    },
  },
};
