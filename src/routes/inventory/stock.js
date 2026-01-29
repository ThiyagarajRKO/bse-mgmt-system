/**
 * Inventory Stock Endpoint
 * Provides real-time inventory queries for production dashboard
 */

export default async (fastify) => {
  // Get Inventory Stock with filters
  fastify.get("/stock", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          warehouse,
          status,
          product_id,
          species_id,
          order_id,
          page = 1,
          limit = 50,
        } = request.query;

        const where = {};
        if (warehouse) where.warehouse = warehouse;
        if (status) where.status = status;
        if (product_id) where.product_id = product_id;

        // If order_id is provided, filter inventory for products in that order
        let orderProductIds = [];
        if (order_id) {
          const orderProducts = await fastify.models.order_products.findAll({
            where: { order_id: order_id, is_active: true },
            attributes: ["product_master_id"],
          });
          orderProductIds = orderProducts.map((op) => op.product_master_id);

          if (orderProductIds.length > 0) {
            where.product_id = {
              [fastify.models.Sequelize.Op.in]: orderProductIds,
            };
          } else {
            // No products in order, return empty result
            return reply.send({
              statusCode: 200,
              data: [],
              total: 0,
              page: parseInt(page),
              pages: 0,
            });
          }
        }

        const InventoryStock = fastify.models.inventory_stock;

        if (!InventoryStock) {
          return reply.code(500).send({
            statusCode: 500,
            message: "Inventory stock model not available",
          });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await InventoryStock.findAndCountAll({
          where,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [["created_at", "DESC"]],
        });

        reply.send({
          statusCode: 200,
          data: rows,
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error fetching inventory stock",
          error: error.message,
        });
      }
    },
  });

  // Get Inventory Stock Summary
  fastify.get("/stock/summary", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const InventoryStock = fastify.models.inventory_stock;

        if (!InventoryStock) {
          return reply.code(500).send({
            statusCode: 500,
            message: "Inventory stock model not available",
          });
        }

        // Get stock by unit_id
        const raw = await InventoryStock.count({
          where: { unit_id: "RAW_INVENTORY" },
        });

        const wip = await InventoryStock.count({
          where: { unit_id: "WIP_RAW_CONSUMPTION" },
        });

        const fg = await InventoryStock.count({
          include: [
            {
              model: models.UnitMaster,
              as: "unit",
              where: {
                unit_code: {
                  [models.Sequelize.Op.iLike]: "%cs%",
                },
              },
              required: true,
            },
          ],
        });

        reply.send({
          statusCode: 200,
          data: {
            raw_inventory: raw,
            wip_inventory: wip,
            fg_inventory: fg,
            total: raw + wip + fg,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error fetching inventory summary",
          error: error.message,
        });
      }
    },
  });

  // Get Stock by Warehouse
  fastify.get("/stock/warehouse/:warehouse", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { warehouse } = request.params;
        const { page = 1, limit = 50 } = request.query;

        const InventoryStock = fastify.models.inventory_stock;

        if (!InventoryStock) {
          return reply.code(500).send({
            statusCode: 500,
            message: "Inventory stock model not available",
          });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await InventoryStock.findAndCountAll({
          where: { warehouse },
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [["quantity_kg", "DESC"]],
        });

        reply.send({
          statusCode: 200,
          warehouse,
          data: rows,
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error fetching warehouse stock",
          error: error.message,
        });
      }
    },
  });
};
