export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: [
        "procurement_id",
        "unit_master_id",
        "dispatch_quantity",
        "vehicle_master_id",
        "driver_master_id",
      ],
      properties: {
        procurement_id: { type: "string" },
        unit_master_id: { type: "string" },
        dispatch_quantity: { type: "string" },
        temperature: { type: "string" },
        delivery_notes: { type: "string" },
        vehicle_master_id: { type: "string" },
        driver_master_id: { type: "string" },
      },
    },
  },
};
