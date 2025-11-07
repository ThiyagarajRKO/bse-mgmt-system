export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "company_name",
        "company_pan",
        "company_address",
        "company_country",
        "company_bank_ac",
        "company_ifsc",
        "company_currency",
        "company_fin_year_start",
      ],
      properties: {
        company_name: { type: "string" },
        company_short_name: { type: "string" },
        company_gstin: { type: "string" },
        company_pan: { type: "string" },
        company_address: { type: "string" },
        company_country: { type: "string" },
        company_bank_ac: { type: "string" },
        company_ifsc: { type: "string" },
        company_currency: { type: "string" },
        company_fin_year_start: { type: "string" },
      },
    },
  },
};
