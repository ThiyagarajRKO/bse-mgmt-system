export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["adjustment_id"],
      properties: {
        adjustment_id: { type: "string" },
      },
    },
  },
};
