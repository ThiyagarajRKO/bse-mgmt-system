export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["size"],
      properties: {
        size: { type: "string" },
        unit_of_measure: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
