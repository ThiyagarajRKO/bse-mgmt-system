export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["packing_id"],
      properties: {
        packing_id: { type: "string" },
      },
    },
  },
};
