export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["sales_inventory_id"],
      properties: {
        sales_inventory_id: { type: "string" },
      },
    },
  },
};
