export const getUploadURLSchema = {
  schema: {
    body: {
      type: "object",
      required: ["file_names", "type"],
      properties: {
        file_names: { type: "array" },
        type: { type: "string" },
      },
    },
  },
};
