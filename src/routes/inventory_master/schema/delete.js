export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["inventory_master_id"],
      properties: {
        inventory_master_id: { type: "string" },
      },
    },
  },
};
