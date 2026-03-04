export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        ledger_name: { type: "string" },
        ledger_code: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
