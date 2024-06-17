export const createSchema = {
  schema: {
    body: {
      type: "object",
      required: ["id","supplier_master_id","procurement_lots","payment_method","total_paid","net_amount","tax_amount","due_amount"],
      properties: {
        id: { type: "string" },
        supplier_master_id: { type: "string" },
        procurement_lots: { type: "string" },
        payment_method: { type: "string" },
        total_paid: { type: "float" },
        net_amount: { type: "float" },
        tax_amount: { type: "float" },
        due_amount: {type: "float"}
      },
    },
  },
};
