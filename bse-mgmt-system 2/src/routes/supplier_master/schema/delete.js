export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["supplier_master_id"],
      properties: {
        supplier_master_id: { type: "string" },
      },
    },
  },
};
