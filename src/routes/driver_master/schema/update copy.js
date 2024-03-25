export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["vehicle_master_id", "vehicle_master_data"],
      properties: {
        vehicle_master_id: { type: "string" },
        vehicle_master_data: { type: "object" },
      },
    },
  },
};
