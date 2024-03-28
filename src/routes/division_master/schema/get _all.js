export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        division_name: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
        "search[value]": { type: "string" },
      },
    },
  },
};
