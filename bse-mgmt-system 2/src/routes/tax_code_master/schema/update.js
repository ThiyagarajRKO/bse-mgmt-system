export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        tax_code: { type: "string" },
        tax_code_name: { type: "string" },
        gst_rate_id: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
