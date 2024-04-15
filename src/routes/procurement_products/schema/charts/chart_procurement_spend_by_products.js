export const getProcurementSpendByProductsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        from_date: { type: "string", format: "date" },
        to_date: { type: "string", format: "date" },
      },
    },
  },
};
