const { Orders } = require("../../../controllers");
const models = require("../../../../models");
const AutoAllocateStock = require("./auto_allocate_stock");
const InventoryCheckService = require("../../../../services/InventoryCheckService");
const PurchaseRequestService = require("../../../../services/PurchaseRequestService");

export const Confirm = async ({ profile_id, order_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        const error = new Error("Order ID is required");
        error.statusCode = 400;
        throw error;
      }

      // Get the order first to check its current status
      const order = await models.Orders.findOne({
        where: { id: order_id },
      });

      if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
      }

      // Check if order is already initiated/confirmed
      if (order.order_status !== "DRAFT") {
        const error = new Error("Order is not in a confirmable state");
        error.statusCode = 400;
        throw error;
      }

      // Update order status to CONFIRMED immediately after confirmation
      // Allocations will be processed asynchronously in the background
      await models.Orders.update(
        {
          order_status: "CONFIRMED",
          is_active: true,
          confirmed_at: new Date(),
        },
        {
          where: { id: order_id },
        },
      );

      // Log the status change
      if (models.OrderStatusLog) {
        await models.OrderStatusLog.create({
          order_id: order_id,
          from_status: "DRAFT",
          to_status: "CONFIRMED",
          changed_by: session?.user_id,
          profile_id: profile_id,
          transition_reason:
            "Order confirmed - allocations processing in background",
        });
      }

      // Get all order products for inventory checking
      const orderProducts = await models.OrderProducts.findAll({
        where: {
          order_id: order_id,
          is_active: true,
        },
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
          },
        ],
      });

      // Process inventory checking and allocation for each order product
      const inventoryCheckPromises = orderProducts.map(async (orderProduct) => {
        try {
          const inventoryResult =
            await InventoryCheckService.checkInventoryForOrderProduct(
              orderProduct.id,
              orderProduct.product_master_id,
              orderProduct.quantity,
            );

          // Create or update allocation with appropriate status
          let allocation = await models.SalesAllocation.findOne({
            where: {
              order_id: order_id,
              order_product_id: orderProduct.id,
            },
          });

          if (!allocation) {
            // Create new allocation
            allocation = await models.SalesAllocation.create({
              order_id: order_id,
              order_product_id: orderProduct.id,
              allocation_status: inventoryResult.allocationStatus,
              allocated_quantity: orderProduct.quantity,
              ordered_quantity: orderProduct.quantity,
              fulfilled_quantity: 0,
              allocated_by: session?.user_id || profile_id,
              allocation_date: new Date(),
              action_required: inventoryResult.action,
              inventory_details: JSON.stringify({
                salesInventoryAvailable:
                  inventoryResult.salesInventoryAvailable,
                purchaseInventoryAvailable:
                  inventoryResult.purchaseInventoryAvailable,
                rawMaterialsAvailable: inventoryResult.rawMaterialsAvailable,
                shortfall: inventoryResult.shortfall,
              }),
            });
          } else {
            // Update existing allocation
            await allocation.update({
              allocation_status: inventoryResult.allocationStatus,
              action_required: inventoryResult.action,
              inventory_details: JSON.stringify({
                salesInventoryAvailable:
                  inventoryResult.salesInventoryAvailable,
                purchaseInventoryAvailable:
                  inventoryResult.purchaseInventoryAvailable,
                rawMaterialsAvailable: inventoryResult.rawMaterialsAvailable,
                shortfall: inventoryResult.shortfall,
              }),
            });
          }

          // Execute inventory reductions based on availability
          if (
            inventoryResult.action === "DISPATCH" ||
            inventoryResult.action === "BEGIN_PRODUCTION"
          ) {
            // Reduce from sales inventory if available
            if (inventoryResult.salesInventoryAvailable > 0) {
              await InventoryCheckService.reduceSalesInventory(
                orderProduct.product_master_id,
                Math.min(
                  inventoryResult.salesInventoryAvailable,
                  orderProduct.quantity,
                ),
                order_id,
              );
            }

            // Reduce raw materials if needed for production
            if (inventoryResult.action === "BEGIN_PRODUCTION") {
              const remainingQuantity =
                orderProduct.quantity - inventoryResult.salesInventoryAvailable;
              if (remainingQuantity > 0) {
                await InventoryCheckService.reduceRawMaterials(
                  orderProduct.product_master_id,
                  remainingQuantity,
                  order_id,
                );
              }
            }
          } else if (inventoryResult.action === "RAISE_PURCHASE_REQUEST") {
            // Create purchase requests for missing raw materials
            try {
              const purchaseRequestResult =
                await PurchaseRequestService.createPurchaseRequest(
                  orderProduct.product_master_id,
                  orderProduct.quantity,
                  order_id,
                  {
                    salesInventoryAvailable:
                      inventoryResult.salesInventoryAvailable,
                    rawMaterials: inventoryResult.rawMaterialsAvailable,
                  },
                );

              fastify.log.info(
                `Purchase request created for order product ${orderProduct.id}: ${purchaseRequestResult.message}`,
              );
            } catch (purchaseError) {
              fastify.log.error(
                `Failed to create purchase request for order product ${orderProduct.id}:`,
                purchaseError,
              );
            }
          }

          fastify.log.info(
            `Inventory processed for order product ${orderProduct.id}: ${inventoryResult.details}`,
          );

          return {
            orderProductId: orderProduct.id,
            action: inventoryResult.action,
            status: inventoryResult.allocationStatus,
            success: true,
          };
        } catch (error) {
          fastify.log.error(
            `Failed to process inventory for order product ${orderProduct.id}:`,
            error,
          );
          return {
            orderProductId: orderProduct.id,
            error: error.message,
            success: false,
          };
        }
      });

      // Wait for all inventory checks to complete
      const inventoryResults = await Promise.allSettled(inventoryCheckPromises);
      const successful = inventoryResults.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length;
      const failed = inventoryResults.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success),
      ).length;

      fastify.log.info(
        `Inventory processing summary for order ${order.order_no}: ${successful} successful, ${failed} failed`,
      );

      // Trigger auto-allocation for any products that still need it (fallback)
      try {
        // Get unique product IDs
        const productIds = orderProducts
          .filter((op) => op.product_master_id)
          .map((op) => op.product_master_id);

        if (productIds.length > 0) {
          fastify.log.info(
            `Triggering auto-allocation for ${productIds.length} products in order ${order.order_no}`,
          );

          // Trigger auto-allocation for each product
          const allocationPromises = productIds.map(
            (productId) =>
              new Promise((resolveAlloc) => {
                AutoAllocateStock({ product_id: productId }, session, fastify)
                  .then((result) => {
                    fastify.log.info(
                      `Auto-allocation completed for product ${productId}:`,
                      result.message,
                    );
                    resolveAlloc(result);
                  })
                  .catch((error) => {
                    fastify.log.error(
                      `Auto-allocation failed for product ${productId}:`,
                      error.message,
                    );
                    // Don't fail the confirmation if allocation fails
                    resolveAlloc({ error: error.message });
                  });
              }),
          );

          // Wait for all allocations to complete (for logging purposes only)
          Promise.allSettled(allocationPromises).then(async (results) => {
            const successful = results.filter(
              (r) => r.status === "fulfilled" && !r.value.error,
            ).length;
            const failed = results.filter(
              (r) => r.status === "rejected" || r.value.error,
            ).length;

            fastify.log.info(
              `Auto-allocation summary for order ${order.order_no}: ${successful} successful, ${failed} failed`,
            );
          });
        }
      } catch (allocErr) {
        // Log allocation error but don't fail order confirmation
        fastify.log.error("Failed to trigger auto-allocation:", allocErr);
      }

      resolve({
        statusCode: 200,
        message:
          "Order confirmed successfully - allocations are being processed in the background",
        data: {
          order_id: order_id,
          status: "CONFIRMED",
          confirmation_initiated: true,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: err?.statusCode || 400,
        message: err?.message || "Failed to confirm order",
      });
    }
  });
};
