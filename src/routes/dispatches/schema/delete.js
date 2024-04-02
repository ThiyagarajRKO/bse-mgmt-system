export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["dispatch_id"],
      properties: {
        dispatch_id: { type: "string" },
      },
    },
  },
};
