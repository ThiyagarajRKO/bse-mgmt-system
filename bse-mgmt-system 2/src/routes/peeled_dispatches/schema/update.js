export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeled_dispatch_id", "peeled_dispatch_data"],
      properties: {
        peeled_dispatch_id: { type: "string" },
        peeled_dispatch_data: { type: "object" },
      },
    },
  },
};
