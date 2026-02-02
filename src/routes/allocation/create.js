import AllocationMaster from "../../../models/allocation_master";
import Orders from "../../../models/orders";
import OrderProducts from "../../../models/order_products";
import { CheckInventory } from "../orders/handlers/check_inventory";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new allocation
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          order_id,
          inventory_id,
          packing_id,
          allocation_qty,
          order_product_id,
        } = request.body;
        const profile_id = request.token_profile_id;

        // Validate required fields
        if (!order_id || !UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_id",
          });
        }

        // Either inventory_id or packing_id must be provided
        if (
          (!inventory_id || !UUID_PATTERN.test(inventory_id)) &&
          (!packing_id || !UUID_PATTERN.test(packing_id))
        ) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Either inventory_id or packing_id must be provided",
          });
        }

        if (!allocation_qty || allocation_qty <= 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "allocation_qty must be a positive number",
          });
        }

        if (!order_product_id || !UUID_PATTERN.test(order_product_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_product_id",
          });
        }

        // Check order status
        const order = await Orders.findByPk(order_id);
        if (!order) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        if (order.status !== "CONFIRMED") {
          return reply.code(400).send({
            statusCode: 400,
            message: `Order must be CONFIRMED to allocate. Current status: ${order.status}`,
          });
        }

        // Get order product to find product_master_id
        const orderProduct = await OrderProducts.findByPk(order_product_id);
        if (!orderProduct) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order product not found",
          });
        }

        // Check inventory availability
        try {
          const inventoryCheck = await CheckInventory(
            { product_master_id: orderProduct.product_master_id },
            null,
            fastify,
          );

          const availableQuantity =
            inventoryCheck?.data?.available_quantity || 0;

          if (allocation_qty > availableQuantity) {
            return reply.code(400).send({
              statusCode: 400,
              message: `Insufficient inventory. Requested: ${allocation_qty}, Available: ${availableQuantity}`,
            });
          }
        } catch (inventoryError) {
          fastify.log.error("Inventory check failed:", inventoryError);
          return reply.code(500).send({
            statusCode: 500,
            message: "Failed to check inventory availability",
          });
        }

        // Create allocation
        const allocationNo = `ALLOC-${Date.now()}`;
        const allocation = await AllocationMaster.create({
          allocation_no: allocationNo,
          order_id,
          order_product_id,
          packing_id: packing_id || null, // null if allocating from inventory
          allocated_quantity: allocation_qty,
          allocated_unit: "KG", // Default unit
          allocation_date: new Date(),
          status: "ALLOCATED",
          created_by: profile_id,
        });

        // Update order status to ALLOCATED
        await order.update({
          status: "ALLOCATED",
          updated_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Allocation created successfully",
          data: allocation,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });
};
