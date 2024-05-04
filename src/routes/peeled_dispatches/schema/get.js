export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["peeled_dispatch_id"],
      properties: {
        peeled_dispatch_id: { type: "string" },
      },
    },
  },
};
