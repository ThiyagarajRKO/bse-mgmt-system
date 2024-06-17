export const getLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        supplier_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
