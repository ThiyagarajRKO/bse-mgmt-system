export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "carrier_name",
        "carrier_address",
        "carrier_country",
        "carrier_phone",
        "carrier_email",
        "carrier_credit",
      ],
      properties: {
        carrier_name: { type: "string" },
        carrier_address: { type: "string" },
        carrier_country: { type: "string" },
        carrier_phone: { type: "string" },
        carrier_email: { type: "string" },
        carrier_credit: { type: "string" },
      },
    },
  },
};
