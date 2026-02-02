export const calculateRequirementsSchema = {
  description:
    "Calculate raw material requirements based on finished product quantity",
  tags: ["Procurement"],
  querystring: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "Product Master ID (UUID)",
      },
      quantityRequired: {
        type: "number",
        description: "Finished product quantity required",
        minimum: 0.1,
      },
      speciesId: {
        type: "string",
        description: "Species ID (optional - auto-detected from product)",
      },
      productCategoryId: {
        type: "string",
        description:
          "Product Category ID (optional - auto-detected from product)",
      },
      productForm: {
        type: "string",
        enum: ["FRESH", "FROZEN", "COOKED", "RTE"],
        description: "Product form (default: FRESH)",
      },
      processingType: {
        type: "string",
        enum: ["RAW", "COOKED"],
        default: "RAW",
        description: "Processing type (default: RAW)",
      },
    },
    required: ["productId", "quantityRequired"],
  },
};

export const multiCategoryRecommendationsSchema = {
  description:
    "Get raw material recommendations for all product form combinations",
  tags: ["Procurement"],
  querystring: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "Product Master ID (UUID)",
      },
      quantityRequired: {
        type: "number",
        description: "Finished product quantity required",
        minimum: 0.1,
      },
      speciesId: {
        type: "string",
        description: "Species ID (optional)",
      },
    },
    required: ["productId", "quantityRequired"],
  },
};
