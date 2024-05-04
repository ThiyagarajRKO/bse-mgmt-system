export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "price_list_name",
        "currency",
        "price_value",
        "product_master_id",
      ],
      properties: {
        price_list_name: { type: "string" },
        currency: { type: "string" },
        price_value: { type: "string" },
        product_master_id: { type: "string" },
      },
    },
  },
};
