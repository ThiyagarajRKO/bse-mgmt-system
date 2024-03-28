export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        product_code: { type: "string" },
        product_name: { type: "string" },
        product_type: { type: "string" },
        location_master_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
