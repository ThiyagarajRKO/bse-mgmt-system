export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      required: [],
      properties: {
        draw: { type: "number" },
        start: { type: "number" },
        length: { type: "number" },

        company_name: { type: "string" },

        "search[value]": { type: "string" },

        search: { type: "string" },

        columns: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true,
          },
        },

        order: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
      additionalProperties: true,
    },
  },
};
