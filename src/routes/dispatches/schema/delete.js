export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["dispatch_id"],
      properties: {
        dispatch_id: { type: "string" },
      },
    },
  },
};
