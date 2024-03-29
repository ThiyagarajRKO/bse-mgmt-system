export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_id", "procurement_data"],
      properties: {
        procurement_id: { type: "string" },
        procurement_data: { type: "object" },
      },
    },
  },
};
