export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["packing_id", "packing_data"],
      properties: {
        packing_id: { type: "string" },
        packing_data: { type: "object" },
      },
    },
  },
};
