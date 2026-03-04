export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["inventory_master_id"],
      properties: {
        inventory_master_id: { type: "string" },
      },
    },
  },
};
