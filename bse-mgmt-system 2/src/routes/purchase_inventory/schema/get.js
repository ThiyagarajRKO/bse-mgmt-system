export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["purchase_inventory_id"],
      properties: {
        purchase_inventory_id: { type: "string" },
      },
    },
  },
};
