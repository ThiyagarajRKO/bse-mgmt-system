export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["ledger_code", "ledger_name", "coa_account_id", "company_id"],
      properties: {
        ledger_code: { type: "string" },
        ledger_name: { type: "string" },
        coa_account_id: { type: "string" },
        company_id: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
