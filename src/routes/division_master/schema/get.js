export const getSchema = {
  schema: {
    params: {
      type: "object",
      required: ["division_master_id"],
      properties: {
        division_master_id: { type: "string" },
      },
    },
  },
};
