export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["location_master_id"],
      properties: {
        location_master_id: { type: "string" },
      },
    },
  },
};
