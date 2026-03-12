export const createSchema = {
  schema: {
    description: "Create Journal Entry",
    tags: ["Accounting"],
    body: {
      type: "object",
      properties: {
        entry_date: { type: "string", format: "date-time" },
        reference_type: {
          type: "string",
          enum: [
            "PROCUREMENT",
            "PRODUCTION",
            "QA",
            "PACKING",
            "DISPATCH",
            "SALES",
            "PAYMENT",
            "MANUAL",
          ],
        },
        reference_id: { type: "string", format: "uuid" },
        description: { type: "string" },
        lines: {
          type: "array",
          items: {
            type: "object",
            properties: {
              account_id: { type: "string", format: "uuid" },
              debit: { type: "number" },
              credit: { type: "number" },
              line_description: { type: "string" },
            },
            required: ["account_id"],
          },
        },
      },
      required: ["reference_type", "lines"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
    },
  },
};

export const postSchema = {
  schema: {
    description: "Post Journal Entry",
    tags: ["Accounting"],
    params: {
      type: "object",
      properties: {
        journal_entry_id: { type: "string", format: "uuid" },
      },
      required: ["journal_entry_id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
    },
  },
};

export const reverseSchema = {
  schema: {
    description: "Reverse Journal Entry",
    tags: ["Accounting"],
    body: {
      type: "object",
      properties: {
        journal_entry_id: { type: "string", format: "uuid" },
        reason: { type: "string" },
      },
      required: ["journal_entry_id", "reason"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
    },
  },
};

export const getSchema = {
  schema: {
    description: "Get Journal Entry",
    tags: ["Accounting"],
    params: {
      type: "object",
      properties: {
        journal_entry_id: { type: "string", format: "uuid" },
      },
      required: ["journal_entry_id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
    },
  },
};

export const getAllSchema = {
  schema: {
    description: "Get All Journal Entries",
    tags: ["Accounting"],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        limit: { type: "integer", default: 50 },
        reference_type: {
          type: "string",
          enum: [
            "PROCUREMENT",
            "PRODUCTION",
            "QA",
            "PACKING",
            "DISPATCH",
            "SALES",
            "PAYMENT",
            "MANUAL",
          ],
        },
        is_posted: { type: "boolean" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object" },
        },
      },
    },
  },
};
