export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["price_list_name", "currency"],
      properties: {
        price_list_name: { type: "string" },
        currency: { type: "string" },
        PriceListProductMaster: { type: "array" },
      },
    },
  },
};
