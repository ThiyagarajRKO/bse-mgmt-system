export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["driver_master_id"],
      properties: {
        driver_master_id: { type: "string" },
      },
    },
  },
};
