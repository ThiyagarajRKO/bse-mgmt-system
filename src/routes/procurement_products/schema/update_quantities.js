export const updateProcurementWithRecommendedQuantitiesSchema = {
  description:
    "Update existing procurement quantities with recommended order quantities from yield calculations",
  tags: ["Procurement"],
  body: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "Order ID (UUID) to update procurement quantities for",
      },
      productUpdates: {
        type: "array",
        description: "Array of product quantity updates",
        items: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "Product Master ID (UUID)",
            },
            recommendedQuantity: {
              type: "number",
              description: "Recommended procurement quantity (kg)",
              minimum: 0.1,
            },
          },
          required: ["productId", "recommendedQuantity"],
        },
      },
    },
    required: ["orderId", "productUpdates"],
  },
};

export const calculateAndUpdateProcurementQuantitiesSchema = {
  description:
    "Calculate recommended procurement quantities using yield standards and update existing procurement orders",
  tags: ["Procurement"],
  body: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description:
          "Order ID (UUID) to calculate and update procurement quantities for",
      },
    },
    required: ["orderId"],
  },
};
