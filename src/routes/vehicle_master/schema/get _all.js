export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        vehicle_number: { type: "string" },
        vehicle_brand: { type: "string" },
        model_number: { type: "string" },
      },
    },
  },
};
