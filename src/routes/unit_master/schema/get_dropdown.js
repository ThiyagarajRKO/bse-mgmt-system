export const getDropdownSchema = {
  schema: {
    querystring: {
      type: "object",
      properties: {
        unit_type: { type: "string" },
      },
    },
  },
};
