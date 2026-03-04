export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["dispatch_id"],
      properties: {
        dispatch_id: { type: "string" },
      },
    },
  },
};
