export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        supplier_name: { type: "string" },
        location_master_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
