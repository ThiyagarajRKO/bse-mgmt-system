export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "string" },
      },
    },
  },
};
