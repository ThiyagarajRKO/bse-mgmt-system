export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        procurement_lot_id: { type: "string" },
        order_id: { type: "string" },
        // allow callers to filter by the human‑readable order number as an
        // alternative to providing the UUID.  the handler will translate
        // order_no into an order_id if the latter is not supplied.
        order_no: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
