export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        account_code: { type: "string" },
        account_name: { type: "string" },
        account_type: { type: "string" },
        company_id: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
