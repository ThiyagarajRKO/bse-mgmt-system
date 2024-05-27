export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["order_id", "order_data"],
      properties: {
        order_id: { type: "string" },
        order_data: { type: "object" },
      },
    },
  },
};
