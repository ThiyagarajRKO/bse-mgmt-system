export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        product_id: { type: "string" },
        tax_code_id: { type: "string" },
        gst_master_id: { type: "string" },
        supply_type: { type: "string" },
        cgst_rate: { type: "number" },
        sgst_rate: { type: "number" },
        igst_rate: { type: "number" },
        effective_from: { type: "string" },
        effective_to: { type: "string" },
        note: { type: "string" },
      },
    },
  },
};
