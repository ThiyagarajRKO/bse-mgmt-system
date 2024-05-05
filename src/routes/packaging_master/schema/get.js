export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["packaging_master_id"],
      properties: {
        packaging_master_id: { type: "string" },
      },
    },
  },
};
