export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["inventory_master_id", "inventory_master_data"],
      properties: {
        inventory_master_id: { type: "string" },
        inventory_master_data: { type: "object" },
      },
    },
  },
};
