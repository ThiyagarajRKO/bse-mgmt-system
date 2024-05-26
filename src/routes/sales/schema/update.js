export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["sales_id", "sales_data"],
      properties: {
        sales_id: { type: "string" },
        sales_data: { type: "object" },
      },
    },
  },
};
