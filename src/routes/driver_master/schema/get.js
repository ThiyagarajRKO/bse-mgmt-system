export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["vehicle_master_id"],
      properties: {
        vehicle_master_id: { type: "string" },
      },
    },
  },
};
