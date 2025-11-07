export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["company_master_id", "company_master_data"],
      properties: {
        company_master_id: { type: "string" },
        company_master_data: { type: "object" },
      },
    },
  },
};
