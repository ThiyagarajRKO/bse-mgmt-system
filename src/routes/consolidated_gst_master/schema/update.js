export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id", "consolidated_gst_master_data"],
      properties: {
        id: { type: "string" },
        consolidated_gst_master_data: {
          type: "object",
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
    },
  },
};
