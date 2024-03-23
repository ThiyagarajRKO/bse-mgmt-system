export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["location_master_id", "vendor_name", "representative"],
      properties: {
        vendor_name: { type: "string" },
        representative: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        location_master_id: { type: "string" },
      },
    },
  },
};
