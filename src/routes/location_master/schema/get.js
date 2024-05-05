export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["location_master_id"],
      properties: {
        location_master_id: { type: "string" },
      },
    },
  },
};
