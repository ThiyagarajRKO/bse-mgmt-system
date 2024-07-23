export const getDispatchLotsSchema = {
  schema: {
    query: {
      type: "object",
      required: ["unit_master_id"],
      properties: {
        unit_master_id: { type: "string" },
        start: { type: "number" },
        length: { type: "number" },
        dropdownSearch: { type: "string" },
      },
    },
  },
};
