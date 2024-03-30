export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["adjustment_id", "adjustment_data"],
      properties: {
        adjustment_id: { type: "string" },
        adjustment_data: { type: "object" },
      },
    },
  },
};
