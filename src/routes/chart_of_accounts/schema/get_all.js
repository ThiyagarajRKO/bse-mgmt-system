export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        account_name: { type: "string" },
        account_code: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
