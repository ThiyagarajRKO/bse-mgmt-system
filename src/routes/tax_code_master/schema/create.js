export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["tax_code", "tax_code_name"],
      properties: {
        tax_code: { type: "string" },
        tax_code_name: { type: "string" },
        gst_rate_id: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
