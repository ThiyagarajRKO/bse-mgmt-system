export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        procurement_date: { type: "string", format: "date" },
        procurement_lot: { type: "string" },
        procurement_unit: { type: "string" },
        procurement_supplier: { type: "string" },
      },
    },
  },
};
