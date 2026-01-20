export const getDropdownSchema = {
  description: "Get raw materials dropdown for procurement product selection",
  tags: ["Procurement Products"],
  querystring: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Search term for product name",
      },
      start: {
        type: ["integer", "string"],
        description: "Start index for pagination",
      },
      length: {
        type: ["integer", "string"],
        description: "Number of records to return",
      },
    },
  },
  response: {
    200: {
      description: "List of raw materials",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            rows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                },
              },
            },
            count: { type: "number" },
          },
        },
      },
    },
  },
};
