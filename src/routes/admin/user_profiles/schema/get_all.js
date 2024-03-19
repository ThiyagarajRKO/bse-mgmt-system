export const getProfilesSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        search: { type: "string" },
        limit: { type: "integer" },
        offset: { type: "integer" },
      },
    },
  },
};
