export const getOrdersSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        customer_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
