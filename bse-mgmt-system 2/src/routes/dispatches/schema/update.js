export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["dispatch_id", "dispatch_data"],
      properties: {
        dispatch_id: { type: "string" },
        dispatch_data: { type: "object" },
      },
    },
  },
};
