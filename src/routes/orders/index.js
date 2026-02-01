import { Create } from "./handlers/create";
import { Update } from "./handlers/update";
import { UpdateStatus } from "./handlers/update_status";
import { Get } from "./handlers/get";
import { GetAll } from "./handlers/get_all";
import { Delete } from "./handlers/delete";
import { GetOrderNumbers } from "./handlers/get_order_no";
import { Confirm } from "./handlers/confirm";
import { GetAllocationData } from "./handlers/get_allocation_data";
import { CheckInventory } from "./handlers/check_inventory";
import { CheckFulfillmentRoute } from "./handlers/check_fulfillment_route";
import { AllocateStock } from "./handlers/allocate_stock";
import { AutoAllocateStock } from "./handlers/auto_allocate_stock";
import { DeleteEmpty } from "./handlers/delete_empty";
import { GetTracking } from "./handlers/get_tracking";
import { GetOrderProducts } from "./handlers/get_order_products";
import CheckStockForProduct from "./handlers/check_stock_for_product";

// Schema
import { createSchema } from "./schema/create";
import { updateSchema } from "./schema/update";
import { updateStatusSchema } from "./schema/update_status";
import { getSchema } from "./schema/get";
import { getAllSchema } from "./schema/get_all";
import { deleteSchema } from "./schema/delete";
import { getOrderNumbersSchema } from "./schema/get_order_no";
import { getTrackingSchema } from "./schema/get_tracking";
import { allocateStockSchema } from "./schema/allocate_stock";

export const ordersRoute = (fastify, opts, done) => {
  fastify.post("/", createSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Create(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        statusCode: result?.statusCode,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.put("/", updateSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Update(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/", getAllSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetAll(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/numbers", getOrderNumbersSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetOrderNumbers(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // Get order products - MUST be before /:order_id route
  fastify.get("/product", async (req, reply) => {
    try {
      const params = {
        profile_id: req?.token_profile_id,
        order_id: req?.query?.order_id,
        start: parseInt(req?.query?.start) || 0,
        length: parseInt(req?.query?.length) || 10,
        search: req?.query?.["search[value]"] || "",
      };

      const result = await GetOrderProducts(params);

      // Format response for DataTable server-side processing
      const response = {
        draw: parseInt(req?.query?.draw) || 1,
        recordsTotal: result?.count || 0,
        recordsFiltered: result?.count || 0,
        data: result?.rows || [],
      };

      // Add caching headers to improve performance for repeated requests
      reply.header("Cache-Control", "private, max-age=30"); // Cache for 30 seconds

      return reply.code(200).send(response);
    } catch (err) {
      console.error("Error in /product route:", err);
      return reply.code(err?.statusCode || 400).send({
        draw: parseInt(req?.query?.draw) || 1,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
        error: err?.message || err,
      });
    }
  });

  // Get order with sales inventory tracking - MUST be before /:order_id route
  fastify.get(
    "/:order_id/tracking",
    { schema: getTrackingSchema.schema },
    async (req, reply) => {
      try {
        const params = { profile_id: req?.token_profile_id, ...req.params };

        const result = await GetTracking(params, req?.session, fastify);

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  // TEMPORARY: Manually trigger order tracking pipeline
  fastify.post("/:order_id/initiate-production", async (req, reply) => {
    try {
      const { order_id } = req.params;

      const {
        createOrderTrackingPipeline,
      } = require("../../services/order-tracking-service");

      // Get the order
      const order = await models.Orders.findOne({
        where: { id: order_id, is_active: true },
        include: [
          {
            model: models.OrderProducts,
            as: "OrderProducts",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!order) {
        return reply.code(404).send({
          success: false,
          message: "Order not found",
        });
      }

      // Trigger the pipeline
      await createOrderTrackingPipeline(order, {
        profile_id: req?.session?.pid || 1,
      });

      return reply.send({
        success: true,
        message: "Production pipeline initiated for order",
      });
    } catch (err) {
      console.error("Error initiating production:", err);
      return reply.code(500).send({
        success: false,
        message: err.message,
      });
    }
  });

  // Get single order by ID - MUST come after /:order_id/tracking
  fastify.get("/:order_id", getSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.params };

      const result = await Get(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.delete("/", deleteSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await Delete(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.post("/confirm", async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.body };

      const result = await Confirm(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/allocation", getAllSchema, async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id, ...req.query };

      const result = await GetAllocationData(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get("/check-inventory/:product_master_id", async (req, reply) => {
    try {
      const params = {
        product_master_id: req?.params?.product_master_id,
        order_id: req?.query?.order_id, // optional order filter
      };

      const result = await CheckInventory(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.post("/allocate-stock", allocateStockSchema, async (req, reply) => {
    try {
      const params = req.body;

      const result = await AllocateStock(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.post("/auto-allocate-stock", async (req, reply) => {
    try {
      const params = req.body;

      const result = await AutoAllocateStock(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  fastify.get(
    "/check-fulfillment-route/:product_master_id",
    async (req, reply) => {
      try {
        const params = {
          product_master_id: req?.params?.product_master_id,
          order_id: req?.query?.order_id,
        };

        const result = await CheckFulfillmentRoute(
          params,
          req?.session,
          fastify,
        );

        return reply.code(result.statusCode || 200).send({
          success: true,
          message: result.message,
          data: result?.data,
        });
      } catch (err) {
        return reply.code(err?.statusCode || 400).send({
          success: false,
          message: err?.message || err,
        });
      }
    },
  );

  // Check if sufficient raw material stock is available for products based on yield
  fastify.post("/check-stock", async (req, reply) => {
    try {
      const orderedProducts = req?.body?.ordered_products;

      if (
        !orderedProducts ||
        !Array.isArray(orderedProducts) ||
        orderedProducts.length === 0
      ) {
        return reply.code(400).send({
          success: false,
          message: "No products provided for stock check",
          canBeginProduct: false,
          suggestProcurement: true,
        });
      }

      // Check stock for all products
      const results = [];
      let allProductsHaveSufficientStock = true;

      for (const product of orderedProducts) {
        const params = {
          product_master_id: product?.product_master_id,
          quantity_required_kg: product?.quantity_required_kg,
        };

        const result = await CheckStockForProduct(
          params,
          req?.session,
          fastify,
        );
        results.push(result);

        if (!result?.canBeginProduct) {
          allProductsHaveSufficientStock = false;
        }
      }

      return reply.code(allProductsHaveSufficientStock ? 200 : 400).send({
        success: allProductsHaveSufficientStock,
        data: {
          canBeginProduct: allProductsHaveSufficientStock,
          suggestProcurement: !allProductsHaveSufficientStock,
          productResults: results,
        },
        message: allProductsHaveSufficientStock
          ? "All products have sufficient stock"
          : "Some products have insufficient stock",
      });
    } catch (err) {
      console.error("Error in check-stock endpoint:", err);
      return reply.code(500).send({
        success: false,
        message: "Error checking stock",
        error: err.message,
        canBeginProduct: false,
        suggestProcurement: true,
      });
    }
  });

  // Delete empty orders (orders without any products)
  fastify.delete("/empty", async (req, reply) => {
    try {
      const params = { profile_id: req?.token_profile_id };

      const result = await DeleteEmpty(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // DEBUG: Test order creation with user_id from user_profiles
  fastify.post("/debug/create-with-user", async (req, reply) => {
    try {
      // Use hardcoded BSE Admin user_id from user_profiles
      const params = {
        profile_id: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82",
        ...req.body,
      };

      const result = await Create(params, req?.session, fastify);

      return reply.code(200).send({
        success: true,
        message: "Order created successfully",
        data: result?.data,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(err?.statusCode || 500).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  // Update order status
  fastify.put("/:order_id/status", updateStatusSchema, async (req, reply) => {
    try {
      const params = {
        profile_id: req?.token_profile_id,
        order_id: req?.params?.order_id,
        ...req.body,
      };

      const result = await UpdateStatus(params, req?.session, fastify);

      return reply.code(result.statusCode || 200).send({
        success: true,
        message: result.message,
        data: result?.data,
      });
    } catch (err) {
      return reply.code(err?.statusCode || 400).send({
        success: false,
        message: err?.message || err,
      });
    }
  });

  done();
};

export default ordersRoute;
