export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["location_master_id", "supplier_name", "representative", "company_id"],
      properties: {
        supplier_name: { type: "string" },
        representative: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        location_master_id: { type: "string" },
        company_id: { type: "string" },
      },
    },
  },
};
