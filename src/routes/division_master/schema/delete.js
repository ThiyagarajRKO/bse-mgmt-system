export const deleteSchema = {
  schema: {
    query: {
      type: "object",
      required: ["division_master_id"],
      properties: {
        division_master_id: { type: "string" },
      },
    },
  },
};
