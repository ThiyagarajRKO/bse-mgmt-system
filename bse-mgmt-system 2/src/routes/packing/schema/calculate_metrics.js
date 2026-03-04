export const calculateMetricsSchema = {
  description: "Calculate packing metrics including cartons, CBM, and pallets",
  tags: ["Packing"],
  summary: "Calculate packing metrics",
  body: {
    type: "object",
    properties: {
      quantity: {
        type: "number",
        minimum: 1,
        description: "Total quantity to pack",
      },
      units_per_carton: {
        type: "number",
        minimum: 1,
        description: "Number of units that fit in each carton",
      },
      carton_details: {
        type: "object",
        properties: {
          dimensions: {
            type: "object",
            properties: {
              length: { type: "number", minimum: 0 },
              width: { type: "number", minimum: 0 },
              height: { type: "number", minimum: 0 },
            },
            required: ["length", "width", "height"],
          },
        },
        required: ["dimensions"],
      },
      is_export: {
        type: "boolean",
        description: "Whether this is for export (affects pallet calculations)",
      },
    },
    required: ["quantity", "units_per_carton", "carton_details"],
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
            total_cartons: { type: "number" },
            total_cbm: { type: "number" },
            pallet_info: {
              type: "object",
              properties: {
                cartons_per_pallet: { type: "number" },
                total_pallets: { type: "number" },
                pallet_dimensions: {
                  type: "object",
                  properties: {
                    length: { type: "number" },
                    width: { type: "number" },
                    height: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
