export const signUpSchema = {
  schema: {
    body: {
      type: "object",
      required: ["first_name", "password"],
      properties: {
        full_name: { type: "string" }, //temp
        first_name: { type: "string" },
        last_name: { type: "string" },
        phone: { type: "string" },
        countryCode: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        dob: { type: "string" },
        role_id: { type: "string" },
      },
    },
  },
};
