export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["unit_master_id", "unit_master_data"],
      properties: {
        unit_master_id: { type: "string" },
        unit_master_data: { type: "object" },
      },
    },
  },
};
