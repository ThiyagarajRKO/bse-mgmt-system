export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["price_list_master_id"],
      properties: {
        price_list_master_id: { type: "string" },
      },
    },
  },
};
