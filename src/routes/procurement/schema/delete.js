export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_id"],
      properties: {
        packaging_master_id: { type: "string" },
      },
    },
  },
};
