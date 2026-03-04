export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["price_list_master_id"],
      properties: {
        price_list_master_id: { type: "string" },
      },
    },
  },
};
