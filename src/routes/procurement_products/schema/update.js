export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["procurement_product_id", "procurement_product_data"],
      properties: {
        procurement_product_id: { type: "string" },
        procurement_product_data: { type: "object" },
      },
    },
  },
};
