export const getPackingProductNamesSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        peeled_dispatch_id: { type: "string" },
        procurement_lot_id: { type: "string" },
        unit_master_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
