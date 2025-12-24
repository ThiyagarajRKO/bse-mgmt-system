export const calculateSchema = {
  description:
    "Calculate complete packing workflow including carton and pallet calculations",
  tags: ["Packing"],
  summary: "Calculate packing workflow",
  body: {
    type: "object",
    properties: {
      product_id: {
        type: "string",
        description: "Product ID for packing calculations",
      },
      market: {
        type: "string",
        enum: ["DOMESTIC", "EXPORT"],
        description: "Market type (DOMESTIC or EXPORT)",
      },
      quantity: {
        type: "number",
        minimum: 1,
        description: "Quantity to pack",
      },
    },
    required: ["product_id", "market", "quantity"],
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
            product_id: { type: "string" },
            market: { type: "string" },
            quantity: { type: "number" },
            packaging: {
              type: "object",
              description: "Packaging suggestions",
            },
            carton: {
              type: "object",
              description: "Carton resolution details",
            },
            calculations: {
              type: "object",
              description: "Packing calculations",
            },
            locked: { type: "boolean" },
          },
        },
      },
    },
  },
};
