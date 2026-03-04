export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["location_name"],
      properties: {
        location_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
