export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_lot_id", "procurement_lot_data"],
      properties: {
        procurement_lot_id: { type: "string" },
        procurement_lot_data: { type: "object" },
      },
    },
  },
};
