export const getSalesInventoryItemsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        product_master_id: { type: "string" },
        start: { type: "string" },
        length: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
