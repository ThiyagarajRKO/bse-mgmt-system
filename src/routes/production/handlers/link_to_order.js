/**
 * Link Production Order to Sales Order
 * Creates a connection between a production order and the sales order it's fulfilling
 */
import models from "../../../../models";

export const LinkToOrder = async (
  { production_order_id, order_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate inputs
      if (!production_order_id || !order_id) {
        return reject({
          statusCode: 400,
          message: "production_order_id and order_id are required",
        });
      }

      // Verify production order exists
      const productionOrder = await models.production_orders.findByPk(
        production_order_id
      );
      if (!productionOrder) {
        return reject({
          statusCode: 404,
          message: `Production order ${production_order_id} not found`,
        });
      }

      // Verify sales order exists
      const salesOrder = await models.Orders.findByPk(order_id);
      if (!salesOrder) {
        return reject({
          statusCode: 404,
          message: `Sales order ${order_id} not found`,
        });
      }

      // Update production order with order reference
      await productionOrder.update(
        {
          order_id: order_id,
        },
        {
          profile_id: session?.profile_id,
        }
      );

      // Fetch updated production order with associations
      const updatedProductionOrder = await models.production_orders.findByPk(
        production_order_id,
        {
          include: [
            {
              model: models.Orders,
              as: "sales_order",
              attributes: ["id", "order_no", "created_at"],
            },
            {
              model: models.species_master,
              as: "input_species",
              attributes: ["id", "species_name"],
            },
          ],
        }
      );

      return resolve({
        statusCode: 200,
        message: "Production order linked to sales order successfully",
        data: {
          production_order: updatedProductionOrder,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reject({
        statusCode: err?.statusCode || 500,
        message:
          err?.message || "Error linking production order to sales order",
      });
    }
  });
};

/**
 * Get Production Orders by Sales Order
 * Retrieves all production orders linked to a specific sales order
 */
export const GetProductionOrdersByOrder = async (
  { order_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!order_id) {
        return reject({
          statusCode: 400,
          message: "order_id is required",
        });
      }

      // Verify sales order exists
      const salesOrder = await models.Orders.findByPk(order_id);
      if (!salesOrder) {
        return reject({
          statusCode: 404,
          message: `Sales order ${order_id} not found`,
        });
      }

      // Get all production orders for this sales order
      const productionOrders = await models.production_orders.findAll({
        where: {
          order_id: order_id,
        },
        include: [
          {
            model: models.species_master,
            as: "input_species",
            attributes: ["id", "species_name"],
          },
          {
            model: models.production_raw_issues,
            as: "raw_issue",
            attributes: ["id", "issue_date", "status"],
          },
          {
            model: models.production_derivatives,
            as: "derivatives",
            attributes: ["id", "product_master_id", "output_quantity_kg"],
          },
          {
            model: models.production_outputs,
            as: "outputs",
            attributes: ["id", "output_quantity_kg", "wastage_quantity_kg"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return resolve({
        statusCode: 200,
        message: "Production orders retrieved successfully",
        data: {
          order_id: order_id,
          order_no: salesOrder.order_no,
          production_orders: productionOrders,
          total_count: productionOrders.length,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reject({
        statusCode: err?.statusCode || 500,
        message: err?.message || "Error retrieving production orders",
      });
    }
  });
};

/**
 * Get Order Details by Production Order
 * Retrieves the sales order details associated with a production order
 */
export const GetOrderByProduction = async (
  { production_order_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input
      if (!production_order_id) {
        return reject({
          statusCode: 400,
          message: "production_order_id is required",
        });
      }

      // Get production order with sales order details
      const productionOrder = await models.production_orders.findByPk(
        production_order_id,
        {
          include: [
            {
              model: models.Orders,
              as: "sales_order",
              include: [
                {
                  model: models.OrderProducts,
                  attributes: ["id", "product_master_id", "quantity"],
                },
                {
                  model: models.CustomerMaster,
                  attributes: ["id", "customer_name", "customer_contact"],
                },
              ],
            },
            {
              model: models.species_master,
              as: "input_species",
              attributes: ["id", "species_name"],
            },
          ],
        }
      );

      if (!productionOrder) {
        return reject({
          statusCode: 404,
          message: `Production order ${production_order_id} not found`,
        });
      }

      return resolve({
        statusCode: 200,
        message: "Order details retrieved successfully",
        data: {
          production_order: productionOrder,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reject({
        statusCode: err?.statusCode || 500,
        message: err?.message || "Error retrieving order details",
      });
    }
  });
};
