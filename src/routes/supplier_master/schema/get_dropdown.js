export const getDropdownSchema = {
  schema: {
    description: "Get suppliers for dropdown",
    tags: ["Supplier Master"],
    querystring: {
      type: "object",
      properties: {
        search: { type: "string" },
        start: { type: ["string", "number"] },
        length: { type: ["string", "number"] },
      },
    },
    response: {
      200: {
        description: "Suppliers retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                supplier_name: { type: "string" },
                supplier_code: { type: "string" },
                is_active: { type: "boolean" },
              },
            },
          },
          total: { type: "number" },
        },
      },
    },
  },
};
