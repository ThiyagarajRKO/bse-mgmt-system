export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        tax_code: { type: "string" },
        tax_code_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
