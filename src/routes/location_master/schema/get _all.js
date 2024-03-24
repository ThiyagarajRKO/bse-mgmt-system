export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        location_name: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
      },
    },
  },
};
