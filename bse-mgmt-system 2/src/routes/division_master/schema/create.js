export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["division_name"],
      properties: {
        division_name: { type: "string" },
        description: { type: "string" },
        company_id: { type: "string", format: "uuid" },
      },
    },
  },
};
