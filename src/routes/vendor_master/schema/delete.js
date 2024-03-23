export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["vendor_master_id"],
      properties: {
        vendor_master_id: { type: "string" },
      },
    },
  },
};
