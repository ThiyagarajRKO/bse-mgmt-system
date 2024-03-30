export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_id"],
      properties: {
        procurement_id: { type: "string" },
      },
    },
  },
};
