export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["sales_id"],
      properties: {
        sales_id: { type: "string" },
      },
    },
  },
};
