export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["carrier_master_id"],
      properties: {
        carrier_master_id: { type: "string" },
      },
    },
  },
};
