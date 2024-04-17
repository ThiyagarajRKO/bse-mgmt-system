export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["packing_id"],
      properties: {
        packing_id: { type: "string" },
      },
    },
  },
};
