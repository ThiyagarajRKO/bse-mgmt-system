export const mfaValidationSchema = {
  schema: {
    body: {
      type: "object",
      required: ["code"],
      properties: {
        code: { type: "string" },
      },
    },
  },
};
