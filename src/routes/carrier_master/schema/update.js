export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["carrier_master_id", "carrier_master_data"],
      properties: {
        carrier_master_id: { type: "string" },
        carrier_master_data: { type: "object" },
      },
    },
  },
};
