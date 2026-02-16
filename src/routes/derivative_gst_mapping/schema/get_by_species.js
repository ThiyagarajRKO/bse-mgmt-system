// routes/derivative_gst_mapping/schema/get_by_species.js
export const getBySpeciesSchema = {
  schema: {
    params: {
      type: "object",
      required: ["species_master_id"],
      properties: {
        species_master_id: { type: "string", format: "uuid" },
      },
    },
  },
};
