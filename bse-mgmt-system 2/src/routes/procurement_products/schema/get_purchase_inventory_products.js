export const getPurchaseInventoryItemsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        product_master_id: { type: "string" },
        procurement_product_type: { type: "string" },
        start: { type: "string" },
        length: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
