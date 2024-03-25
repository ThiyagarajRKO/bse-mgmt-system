export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["unit_name", "location_master_id", "unit_type"],
      properties: {
        unit_name: { type: "string" },
        unit_type: { type: "string" },
        location_master_id: { type: "string" },
      },
    },
  },
};
