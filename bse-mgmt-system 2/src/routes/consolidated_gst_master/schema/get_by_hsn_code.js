export const getByHsnCodeSchema = {
  schema: {
    params: {
      type: "object",
      required: ["hsn_code"],
      properties: {
        hsn_code: { type: "string" },
      },
    },
  },
};
