export const getPeeledLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        peeled_date: { type: "string", format: "date" },
        peeled_lot: { type: "string" },
        peeling_center: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
