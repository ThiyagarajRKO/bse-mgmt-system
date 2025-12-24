export const calculateCompleteCostSchema = {
  description:
    "Calculate complete packaging cost analysis with true landed cost per kg/unit",
  tags: ["Packing", "Cost Calculation"],
  summary: "Calculate complete packaging cost",
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
      pallet_id: {
        type: "string",
        description: "Pallet material ID (required for export)",
      },
      units_per_carton: {
        type: "number",
        minimum: 1,
        description: "Number of units that fit in each carton",
      },
      cartons_per_pallet: {
        type: "number",
        minimum: 1,
        default: 1,
        description: "Number of cartons per pallet",
      },
      total_units: {
        type: "number",
        minimum: 1,
        description: "Total number of units to package",
      },
      net_weight_kg: {
        type: "number",
        minimum: 0.001,
        description: "Net weight in kilograms",
      },
      is_export: {
        type: "boolean",
        default: false,
        description: "Whether this is for export (affects pallet calculations)",
      },
      strapping_cost: {
        type: "number",
        minimum: 0,
        default: 0,
        description: "Strapping cost per pallet",
      },
      label_cost: {
        type: "number",
        minimum: 0,
        default: 0,
        description: "Label cost per pallet",
      },
      effective_date: {
        type: "string",
        format: "date",
        description: "Effective date for cost lookup (defaults to today)",
      },
    },
    required: [
      "primary_packaging_id",
      "carton_id",
      "units_per_carton",
      "total_units",
      "net_weight_kg",
    ],
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
            summary: {
              type: "object",
              properties: {
                total_units: { type: "number" },
                net_weight_kg: { type: "number" },
                total_cartons: { type: "number" },
                total_packaging_cost: { type: "number" },
                cost_per_kg: { type: "number" },
                cost_per_unit: { type: "number" },
                is_export: { type: "boolean" },
              },
            },
            carton_costs: { type: "object" },
            pallet_costs: { type: "object", nullable: true },
            breakdown: {
              type: "object",
              properties: {
                carton_level_costs: { type: "number" },
                pallet_level_costs: { type: "number" },
                additional_costs: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};
