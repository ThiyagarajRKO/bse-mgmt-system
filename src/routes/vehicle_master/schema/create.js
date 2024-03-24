export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["vehicle_number", "vehicle_brand", "model_number"],
      properties: {
        vehicle_number: { type: "string" },
        vehicle_brand: { type: "string" },
        model_number: { type: "string" },
        insurance_provider: { type: "string" },
        insurance_number: { type: "string" },
        insurance_expiring_on: { type: "string" },
        last_fc_date: { type: "string" },
      },
    },
  },
};
