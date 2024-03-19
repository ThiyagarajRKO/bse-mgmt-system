export const otpValidationSchema = {
  schema: {
    body: {
      type: "object",
      required: ["otp", "type"],
      properties: {
        otp: { type: "string" },
        type: { type: "string" },
      },
    },
  },
};
