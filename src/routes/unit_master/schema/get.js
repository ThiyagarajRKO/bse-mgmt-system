export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["unit_master_id"],
      properties: {
        unit_master_id: { type: "string" },
      },
    },
  },
};
