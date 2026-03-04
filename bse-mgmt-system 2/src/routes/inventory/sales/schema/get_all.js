export const getAllSchema = {
  description: "Get all sales inventory data",
  tags: ["Inventory"],
  summary: "Get all sales inventory data without pagination",
  response: {
    200: {
      description: "Successful response",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              quantity: { type: "number" },
              ProductMaster: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  product_name: { type: "string" },
                  ProductCategoryMaster: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      product_category: { type: "string" },
                      SpeciesMaster: {
                        type: "object",
                        properties: {
                          id: { type: "number" },
                          species_name: { type: "string" },
                        },
                      },
                    },
                  },
                  SizeMaster: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      size: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        total: { type: "number" },
      },
    },
  },
};
