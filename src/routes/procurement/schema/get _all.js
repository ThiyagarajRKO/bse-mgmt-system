export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        procurement_date: { type: "string", format: "date" },
        procurement_lot: { type: "string" },
        procurement_unit: { type: "string" },
        procurement_species: { type: "string" },
        procurement_product: { type: "string" },
        procurement_product_type: { type: "string" },
        procurement_quantity: { type: "integer" },
        procurement_price: { type: "integer" },
        procurement_totalamount: { type: "integer" },
        procurement_purchaser: { type: "string" },
        procurement_supplier: { type: "string" },
      },
    },
  },
};
