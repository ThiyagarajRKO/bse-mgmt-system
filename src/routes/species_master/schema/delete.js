export const deleteSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_master_id"],
      properties: {
        species_master_id: { type: "string" },
      },
    },
  },
};
