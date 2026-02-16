// routes/derivative_gst_mapping/schema/get_for_product.js
export const getForProductSchema = {
  schema: {
    params: {
      type: "object",
      required: ["product_id"],
      properties: {
        product_id: { type: "string", format: "uuid" },
      },
    },
  },
};
