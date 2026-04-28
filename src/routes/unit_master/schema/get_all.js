export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        start: { type: "number" },
        length: { type: "number" },
        unit_code: { type: "string" },
        unit_name: { type: "string" },
        unit_type: {
          oneOf: [
            { type: "string" },
            {
              type: "array",
              items: { type: "string" },
            },
          ],
        },
        location_master_name: { type: "string" },
        company_name: { type: "string" },
        "search[value]": { type: "string" },
      },
    },
  },
};
