// routes/derivative_gst_mapping/schema/create.js
export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["species_master_id", "processing_state", "gst_master_id"],
      properties: {
        species_master_id: { type: "string", format: "uuid" },
        derivative_master_id: { type: "string", format: "uuid" },
        processing_state: {
          type: "string",
          enum: ["RAW", "PROCESSED"],
        },
        gst_master_id: { type: "string", format: "uuid" },
        hsn_code_override: { type: "string", maxLength: 10 },
        effective_from: { type: "string", format: "date-time" },
        effective_to: { type: "string", format: "date-time" },
      },
    },
  },
};
