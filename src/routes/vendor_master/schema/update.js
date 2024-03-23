export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["vendor_master_id", "vendor_master_data"],
      properties: {
        vendor_master_id: { type: "string" },
        vendor_master_data: { type: "object" },
      },
    },
  },
};
