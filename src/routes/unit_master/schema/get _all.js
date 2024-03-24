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
        unit_type: { type: "string" },
        location_master_name: { type: "string" },
      },
    },
  },
};
