export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["supplier_master_id"],
      properties: {
        supplier_master_id: { type: "string" },
      },
    },
  },
};
