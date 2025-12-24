export const lockCalculationsSchema = {
  description:
    "Lock packing calculations for invoice, packing list, and shipping bill documentation",
  tags: ["Packing"],
  summary: "Lock packing calculations",
  body: {
    type: "object",
    properties: {
      packing_calculation_id: {
        type: "string",
        description: "ID of the packing calculation to lock",
      },
    },
    required: ["packing_calculation_id"],
  },
  response: {
    200: {
      description: "Successful response",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            packing_calculation_id: { type: "string" },
            locked: { type: "boolean" },
            locked_at: { type: "string", format: "date-time" },
            locked_for: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
  },
};
