export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        carrier_name: { type: "string" },
        carrier_country: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
