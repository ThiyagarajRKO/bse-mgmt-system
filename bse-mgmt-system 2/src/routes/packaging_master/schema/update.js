export const updateSchema = {
  schema: {
    body: {
      type: "object",
      required: ["packaging_master_id", "packaging_master_data"],
      properties: {
        packaging_master_id: { type: "string" },
        packaging_master_data: { type: "object" },
      },
    },
  },
};
