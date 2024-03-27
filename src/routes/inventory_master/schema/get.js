export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["inventory_master_id"],
      properties: {
        inventory_master_id: { type: "string" },
      },
    },
  },
};
