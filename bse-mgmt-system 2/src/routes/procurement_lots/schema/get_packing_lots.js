export const getPackingLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        packing_date: { type: "string", format: "date" },
        packing_lot: { type: "string" },
        packing_distribution_center: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
