export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        ledger_code: { type: "string" },
        ledger_name: { type: "string" },
        coa_account_id: { type: "string" },
        company_id: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
