export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["size_master_id", "size_master_data"],
      properties: {
        size_master_id: { type: "string" },
        size_master_data: { type: "object" },
      },
    },
  },
};
