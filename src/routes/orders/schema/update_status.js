export const updateStatusSchema = {
  schema: {
    body: {
      type: "object",
      required: ["order_id"],
      properties: {
        order_id: { type: "string" },
        order_status: {
          type: "string",
          enum: [
            "DRAFT",
            "CONFIRMED",
            "ALLOCATED",
            "IN_PRODUCTION",
            "PACKED",
            "READY_FOR_QA",
            "READY_FOR_DISPATCH",
            "DISPATCHED",
            "INVOICED",
          ],
        },
        delivery_status: { type: "string" },
      },
    },
  },
};
