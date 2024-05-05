export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["shipping_master_id"],
      properties: {
        shipping_master_id: { type: "string" },
      },
    },
  },
};
