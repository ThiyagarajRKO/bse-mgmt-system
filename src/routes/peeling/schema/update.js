export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["peeling_id", "peeling_data"],
      properties: {
        peeling_id: { type: "string" },
        peeling_data: { type: "object" },
      },
    },
  },
};
