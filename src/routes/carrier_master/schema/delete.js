export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["carrier_master_id"],
      properties: {
        carrier_master_id: { type: "string" },
      },
    },
  },
};
