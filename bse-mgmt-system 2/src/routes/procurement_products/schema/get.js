export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["procurement_product_id"],
      properties: {
        procurement_product_id: { type: "string" },
      },
    },
  },
};
