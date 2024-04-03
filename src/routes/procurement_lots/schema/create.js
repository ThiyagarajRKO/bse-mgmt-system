export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_date", "unit_master_id"],
      properties: {
        procurement_date: { type: "string", format: "date" },
        unit_master_id: { type: "string" },
      },
    },
  },
};
