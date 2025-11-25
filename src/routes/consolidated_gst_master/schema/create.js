export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["hsn_code"],
      properties: {
        hsn_code: { type: "string" },
        gst_name: { type: "string" },
        cgst_rate: { type: "number" },
        sgst_rate: { type: "number" },
        igst_rate: { type: "number" },
        effective_from: {
          anyOf: [{ type: "string", format: "date" }, { type: "null" }],
        },
        effective_to: {
          anyOf: [{ type: "string", format: "date" }, { type: "null" }],
        },
      },
    },
  },
};
