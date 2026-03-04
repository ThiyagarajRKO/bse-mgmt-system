export const resolveCartonSchema = {
  description: "Resolve master carton based on packaging type and quantity",
  tags: ["Packing"],
  summary: "Resolve master carton",
  body: {
    type: "object",
    properties: {
      primary_packaging_type: {
        type: "string",
        description: "Primary packaging type (e.g., 'BOX', 'BAG')",
      },
      quantity: {
        type: "number",
        minimum: 1,
        description: "Quantity to pack",
      },
      market: {
        type: "string",
        enum: ["DOMESTIC", "EXPORT"],
        description: "Market type (DOMESTIC or EXPORT)",
      },
    },
    required: ["primary_packaging_type", "quantity"],
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
            carton_id: { type: "string" },
            carton_details: {
              type: "object",
              properties: {
                code: { type: "string" },
                dimensions: {
                  type: "object",
                  properties: {
                    length: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" },
                  },
                },
                weight: { type: "number" },
              },
            },
            units_per_carton: { type: "number" },
          },
        },
      },
    },
  },
};
