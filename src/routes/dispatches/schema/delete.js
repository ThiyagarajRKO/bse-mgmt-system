export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["dispatch_master_id"],
      properties: {
        dispatch_master_id: { type: "string" },
      },
    },
  },
};