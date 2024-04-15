export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeled_dispatch_id"],
      properties: {
        peeled_dispatch_id: { type: "string" },
      },
    },
  },
};
