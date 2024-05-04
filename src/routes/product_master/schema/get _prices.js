export const getPricesSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        product_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
