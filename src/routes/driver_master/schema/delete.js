export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["driver_master_id"],
      properties: {
        driver_master_id: { type: "string" },
      },
    },
  },
};
