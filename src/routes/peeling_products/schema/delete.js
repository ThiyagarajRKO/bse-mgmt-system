export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeled_product_id"],
      properties: {
        peeled_product_id: { type: "string" },
      },
    },
  },
};
