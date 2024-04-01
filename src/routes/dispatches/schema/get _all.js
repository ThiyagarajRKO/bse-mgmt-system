export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        lot_no: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
