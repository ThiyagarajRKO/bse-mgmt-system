export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["vehicle_master_id"],
      properties: {
        vehicle_master_id: { type: "string" },
      },
    },
  },
};
