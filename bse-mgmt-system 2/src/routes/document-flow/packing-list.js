import PackingListController from "../../controllers/packing_list.js";

// Schema definitions
const generatePackingListSchema = {
  body: {
    type: "object",
    required: ["sales_order_id"],
    properties: {
      sales_order_id: { type: "string" },
    },
  },
};

const approvePackingListSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

const lockPackingListSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

const getPackingListSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

const getPackingListsByOrderSchema = {
  params: {
    type: "object",
    required: ["sales_order_id"],
    properties: {
      sales_order_id: { type: "string" },
    },
  },
};

export const packingListRoutes = (fastify, opts, done) => {
  // Generate packing list from sales order
  fastify.post(
    "/generate",
    {
      schema: generatePackingListSchema,
      preHandler: fastify.authenticate,
    },
    PackingListController.generatePackingList
  );

  // Approve packing list
  fastify.put(
    "/:id/approve",
    {
      schema: approvePackingListSchema,
      preHandler: fastify.authenticate,
    },
    PackingListController.approvePackingList
  );

  // Lock packing list
  fastify.put(
    "/:id/lock",
    {
      schema: lockPackingListSchema,
      preHandler: fastify.authenticate,
    },
    PackingListController.lockPackingList
  );

  // Get packing list details
  fastify.get(
    "/:id",
    {
      schema: getPackingListSchema,
      preHandler: fastify.authenticate,
    },
    PackingListController.getPackingList
  );

  // Get packing lists by sales order
  fastify.get(
    "/order/:sales_order_id",
    {
      schema: getPackingListsByOrderSchema,
      preHandler: fastify.authenticate,
    },
    PackingListController.getPackingListsByOrder
  );

  done();
};
