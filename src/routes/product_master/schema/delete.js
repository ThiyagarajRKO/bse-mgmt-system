export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["product_master_id"],
      properties: {
        product_master_id: { type: "string" },
      },
    },
  },
};
