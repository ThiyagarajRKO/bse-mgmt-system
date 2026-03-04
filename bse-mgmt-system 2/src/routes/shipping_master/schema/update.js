export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["shipping_master_id", "shipping_master_data"],
      properties: {
        shipping_master_id: { type: "string" },
        shipping_master_data: { type: "object" },
      },
    },
  },
};
