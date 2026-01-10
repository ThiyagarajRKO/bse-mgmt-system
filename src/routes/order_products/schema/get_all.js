export const getAllSchema = {
  schema: {
    query: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "string" },
        start: { type: ["number", "string"] },
        length: { type: ["number", "string"] },
        draw: { type: ["number", "string"] },
        "search[value]": { type: "string" },
        "search[regex]": { type: ["string", "boolean"] },
        _: { type: "string" }, // DataTables cache buster
      },
      // Allow any additional DataTables parameters
      additionalProperties: true,
    },
  },
};
