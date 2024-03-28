export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        inventory_name: { type: "string" },
        inventory_uom: { type: "string" },
        inventory_category: { type: "string" },
        vendor_master_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
