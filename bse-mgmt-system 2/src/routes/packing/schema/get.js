export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["packing_id"],
      properties: {
        packing_id: { type: "string" },
      },
    },
  },
};
