export const calculateCartonCostSchema = {
  description:
    "Calculate cost per carton including primary packaging, secondary packaging, and carton costs",
  tags: ["Packing", "Cost Calculation"],
  summary: "Calculate carton cost",
  body: {
    type: "object",
    properties: {
      primary_packaging_id: {
        type: "string",
        description: "Primary packaging material ID",
      },
      secondary_packaging_id: {
        type: "string",
        description: "Secondary packaging material ID (optional)",
      },
      carton_id: {
        type: "string",
        description: "Master carton ID",
      },
      units_per_carton: {
        type: "number",
        minimum: 1,
        description: "Number of units that fit in each carton",
      },
      effective_date: {
        type: "string",
        format: "date",
        description: "Effective date for cost lookup (defaults to today)",
      },
    },
    required: ["primary_packaging_id", "carton_id", "units_per_carton"],
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
            units_per_carton: { type: "number" },
            costs: {
              type: "object",
              properties: {
                primary_packaging: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    code: { type: "string" },
                    cost_per_unit: { type: "number" },
                    total_cost: { type: "number" },
                  },
                },
                secondary_packaging: {
                  type: "object",
                  nullable: true,
                },
                carton: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    code: { type: "string" },
                    cost_per_carton: { type: "number" },
                    total_cost: { type: "number" },
                  },
                },
              },
            },
            total_cost_per_carton: { type: "number" },
          },
        },
      },
    },
  },
};
