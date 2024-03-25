export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["driver_master_id", "driver_master_data"],
      properties: {
        driver_master_id: { type: "string" },
        driver_master_data: { type: "object" },
      },
    },
  },
};
