export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["procurement_lot_id"],
      properties: {
        procurement_lot_id: { type: "string" },
      },
    },
  },
};
