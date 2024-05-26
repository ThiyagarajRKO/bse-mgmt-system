export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["sales_id"],
      properties: {
        sales_id: { type: "string" },
      },
    },
  },
};
