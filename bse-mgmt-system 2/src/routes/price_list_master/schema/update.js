export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["price_list_master_id", "price_list_master_data"],
      properties: {
        price_list_master_id: { type: "string" },
        price_list_master_data: { type: "object" },
      },
    },
  },
};
