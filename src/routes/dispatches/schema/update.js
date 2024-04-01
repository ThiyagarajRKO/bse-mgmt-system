export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["dispatch_master_id", "dispatch_master_data"],
      properties: {
        dispatch_master_id: { type: "string" },
        dispatch_master_data: { type: "object" },
      },
    },
  },
};
