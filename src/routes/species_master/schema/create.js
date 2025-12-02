export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "division_master_id",
        "species_code",
        "species_name",
        "scientific_name",
      ],
      properties: {
        division_master_id: { type: "string" },
        parent_category_type: {
          type: "string",
          enum: [
            "Bivalve",
            "Cephalopod",
            "Fish",
            "Crustacean",
            "Gastropod",
            "Other",
          ],
        },
        species_code: { type: "string" },
        species_name: { type: "string" },
        scientific_name: { type: "string" },
        hsn_code: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};
