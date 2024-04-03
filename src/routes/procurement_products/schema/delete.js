export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_product_id"],
      properties: {
        procurement_product_id: { type: "string" },
      },
    },
  },
};
