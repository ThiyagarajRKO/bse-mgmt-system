export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      additionalProperties: true,
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        procurement_lot_id: { type: "string" },
        "search[value]": { type: "string" },
        draw: { type: ["number", "string"] },
      },
    },
  },
};
