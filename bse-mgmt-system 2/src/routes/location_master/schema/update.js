export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["location_master_id", "location_master_data"],
      properties: {
        location_master_id: { type: "string" },
        location_master_data: { type: "object" },
      },
    },
  },
};
