export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        carrier_master_id: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
