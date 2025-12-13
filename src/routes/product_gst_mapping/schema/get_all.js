export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        product_id: { type: "string" },
        tax_code_id: { type: "string" },
        gst_master_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
