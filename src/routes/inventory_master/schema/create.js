export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["inventory_name", "inventory_uom", "inventory_category", "vendor_master_id"],
      properties: {
        inventory_name: { type: "string" },
        inventory_uom: { type: "string" },
        inventory_category: { type: "string" },
        vendor_master_id: { type: "string" },
      },
    },
  },
};
