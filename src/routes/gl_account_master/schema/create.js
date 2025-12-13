export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["account_code", "account_name", "account_type"],
      properties: {
        account_code: { type: "string" },
        account_name: { type: "string" },
        account_type: { type: "string" },
        company_id: { type: "string" },
        parent_account_code: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
