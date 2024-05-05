export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["driver_master_id"],
      properties: {
        driver_master_id: { type: "string" },
      },
    },
  },
};
