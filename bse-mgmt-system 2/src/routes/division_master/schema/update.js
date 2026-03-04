export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["division_master_id", "division_master_data"],
      properties: {
        division_master_id: { type: "string" },
        division_master_data: { type: "object" },
      },
    },
  },
};
