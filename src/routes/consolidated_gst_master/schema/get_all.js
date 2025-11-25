export const getAllSchema = {
  schema: {
    querystring: {
      type: "object",
      required: [],
      properties: {
        draw: { type: "number" },
        start: { type: "number" },
        length: { type: "number" },

        gst_name: { type: "string" },
        hsn_code: { type: "string" },

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
    },
  },
};
