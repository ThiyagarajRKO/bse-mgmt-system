export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "string" },
      },
    },
  },
};
