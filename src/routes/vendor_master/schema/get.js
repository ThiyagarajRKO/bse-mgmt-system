export const getSchema = {
  schema: {
    query: {
      type: "object",
      required: ["vendor_master_id"],
      properties: {
        vendor_master_id: { type: "string" },
      },
    },
  },
};
