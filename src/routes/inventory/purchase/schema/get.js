export const getSchema = {
  description: "Get purchase inventory data for DataTables",
  tags: ["Inventory"],
  summary: "Get purchase inventory data for DataTables server-side processing",
  querystring: {
    type: "object",
    properties: {
      draw: { type: "string", description: "DataTables draw counter" },
      start: { type: "string", description: "Starting record index" },
      length: { type: "string", description: "Number of records to return" },
      "search[value]": { type: "string", description: "Search value" },
    },
  },
  response: {
    200: {
      description: "Successful response",
      type: "object",
      properties: {
        draw: { type: "number" },
        recordsTotal: { type: "number" },
        recordsFiltered: { type: "number" },
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              procurement_product_type: { type: "string" },
              quantity: { type: "number" },
              ProductMaster: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  product_name: { type: "string" },
                  ProductCategoryMaster: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      product_category: { type: "string" },
                      SpeciesMaster: {
                        type: "object",
                        properties: {
                          id: { type: "number" },
                          species_name: { type: "string" },
                        },
                      },
                    },
                  },
                  SizeMaster: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      size: { type: "string" },
                    },
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
