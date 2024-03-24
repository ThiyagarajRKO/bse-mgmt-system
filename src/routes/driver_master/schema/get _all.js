export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: [],
      properties: {
        driver_name: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        blood_group: { type: "string" },
        health_history: { type: "string" },
      },
    },
  },
};
