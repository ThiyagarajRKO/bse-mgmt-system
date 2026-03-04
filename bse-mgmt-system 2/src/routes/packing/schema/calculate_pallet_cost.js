export const calculatePalletCostSchema = {
  description:
    "Calculate cost per pallet including carton costs, pallet material, strapping, and labels (for export)",
  tags: ["Packing", "Cost Calculation"],
  summary: "Calculate pallet cost",
  body: {
    type: "object",
    properties: {
      pallet_id: {
        type: "string",
        description: "Pallet material ID",
      },
      cartons_per_pallet: {
        type: "number",
        minimum: 1,
        description: "Number of cartons per pallet",
      },
      carton_cost_per_carton: {
        type: "number",
        minimum: 0,
        description: "Cost per carton",
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
    required: ["pallet_id", "cartons_per_pallet", "carton_cost_per_carton"],
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
            cartons_per_pallet: { type: "number" },
            costs: {
              type: "object",
              properties: {
                cartons: {
                  type: "object",
                  properties: {
                    quantity: { type: "number" },
                    cost_per_carton: { type: "number" },
                    total_cost: { type: "number" },
                  },
                },
                pallet: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    code: { type: "string" },
                    cost_per_pallet: { type: "number" },
                    total_cost: { type: "number" },
                  },
                },
                additional: {
                  type: "object",
                  properties: {
                    strapping_cost: { type: "number" },
                    label_cost: { type: "number" },
                    total_additional: { type: "number" },
                  },
                },
              },
            },
            total_cost_per_pallet: { type: "number" },
          },
        },
      },
    },
  },
};
