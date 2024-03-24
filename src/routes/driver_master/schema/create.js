export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "driver_name",
        "license_number",
        "aadhar_number",
        "phone",
        "emergency_contact",
        "blood_group",
      ],
      properties: {
        driver_name: { type: "string" },
        license_number: { type: "string" },
        aadhar_number: { type: "string" },
        phone: { type: "string" },
        emergency_contact: { type: "string" },
        address: { type: "string" },
        blood_group: { type: "string" },
        health_history: { type: "string" },
      },
    },
  },
};
