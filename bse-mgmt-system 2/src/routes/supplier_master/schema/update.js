export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["supplier_master_id", "supplier_master_data"],
      properties: {
        supplier_master_id: { type: "string" },
        supplier_master_data: { type: "object" },
      },
    },
  },
};
