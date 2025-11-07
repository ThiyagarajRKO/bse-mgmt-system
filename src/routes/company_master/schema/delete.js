export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["company_master_id"],
      properties: {
        company_master_id: { type: "string" },
      },
    },
  },
};
