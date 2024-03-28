export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["division_master_id"],
      properties: {
        division_master_id: { type: "string" },
      },
    },
  },
};
