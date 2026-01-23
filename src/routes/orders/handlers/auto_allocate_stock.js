const models = require("../../../../models");

const AutoAllocateStock = async ({ product_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      console.log(
        `🔍 Checking automatic allocation for product: ${product_id}`,
      );

      // Get total available finished goods for this product
      const fgInventory = await models.inventory_stock.findAll({
        where: {
          product_id: product_id,
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
        },
        attributes: ["id", "available_qty", "lot_id"],
        order: [["updated_at", "ASC"]], // FIFO allocation
      });

      if (!fgInventory || fgInventory.length === 0) {
        return reject({
          statusCode: 400,
          message: "No finished goods available for this product",
        });
      }

      const totalAvailable = fgInventory.reduce(
        (sum, inv) => sum + parseFloat(inv.available_qty),
        0,
      );

      console.log(`📦 Total available inventory: ${totalAvailable} kg`);

      // Find orders that need allocation for this product
      const pendingOrders = await models.OrderProducts.findAll({
        where: {
          product_master_id: product_id,
          delivery_status: {
            [models.Sequelize.Op.ne]: "ALLOCATED",
          },
          is_active: true,
        },
        include: [
          {
            model: models.Orders,
            as: "Order",
            where: {
              order_status: {
                [models.Sequelize.Op.ne]: "ALLOCATED",
              },
              is_active: true,
            },
            required: true,
          },
        ],
        attributes: [
          "id",
          "order_id",
          "product_master_id",
          "quantity",
          "delivery_status",
        ],
        order: [["created_at", "ASC"]], // FIFO order processing
      });

      if (pendingOrders.length === 0) {
        return resolve({
          statusCode: 200,
          message: "No pending orders found for this product",
          data: {
            product_id,
            total_available: totalAvailable,
            pending_orders: 0,
          },
        });
      }

      console.log(
        `📋 Found ${pendingOrders.length} pending orders for allocation`,
      );

      let remainingInventory = totalAvailable;
      const allocations = [];

      // Process orders in FIFO order
      for (const orderProduct of pendingOrders) {
        if (remainingInventory <= 0) break;

        const orderQuantity = parseFloat(orderProduct.quantity);
        const allocateQuantity = Math.min(orderQuantity, remainingInventory);

        console.log(
          `🎯 Processing order ${orderProduct.Order.order_no}: Need ${orderQuantity}kg, Available ${remainingInventory}kg, Allocating ${allocateQuantity}kg`,
        );

        // Start transaction for this allocation
        const transaction = await models.sequelize.transaction();

        try {
          let allocatedFromInventory = 0;

          // Allocate from inventory lots (FIFO)
          for (const inventory of fgInventory) {
            if (allocatedFromInventory >= allocateQuantity) break;

            const availableQty = parseFloat(inventory.available_qty);
            if (availableQty <= 0) continue;

            const allocateFromThisLot = Math.min(
              allocateQuantity - allocatedFromInventory,
              availableQty,
            );

            // Create inventory transaction
            await models.inventory_transaction.create(
              {
                stock_id: inventory.id,
                product_id: product_id,
                transaction_type: "DISPATCH",
                qty_change: -allocateFromThisLot,
                uom: "KG",
                reference_type: "SALES_ORDER",
                reference_id: orderProduct.order_id,
                warehouse_from: "CS_UNIT",
                notes: `Auto-allocated to order ${orderProduct.Order.order_no}`,
                created_by: session?.pid || session?.user_id,
              },
              { transaction },
            );

            // Update inventory stock
            const currentStock = await models.inventory_stock.findByPk(
              inventory.id,
              { transaction },
            );
            if (currentStock) {
              await currentStock.update(
                {
                  reserved_qty:
                    parseFloat(currentStock.reserved_qty) + allocateFromThisLot,
                  available_qty:
                    parseFloat(currentStock.available_qty) -
                    allocateFromThisLot,
                  updated_at: new Date(),
                },
                { transaction },
              );
            }

            allocatedFromInventory += allocateFromThisLot;
          }

          // Update order status to ALLOCATED
          await models.Orders.update(
            {
              order_status: "ALLOCATED",
              updated_at: new Date(),
            },
            {
              where: { id: orderProduct.order_id, is_active: true },
              transaction,
            },
          );

          // Update order product status
          await models.OrderProducts.update(
            {
              delivery_status: "ALLOCATED",
              updated_at: new Date(),
            },
            {
              where: {
                id: orderProduct.id,
                is_active: true,
              },
              transaction,
            },
          );

          // Create allocation_master record (skip for auto-allocation since no packing yet)
          // const allocationNo = `AUTO-ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          // await models.AllocationMaster.create(
          //   {
          //     allocation_no: allocationNo,
          //     order_id: orderProduct.order_id,
          //     order_product_id: orderProduct.id,
          //     packing_id: null,
          //     allocated_quantity: allocateQuantity,
          //     allocated_unit: "KG",
          //     allocation_date: new Date(),
          //     status: "ALLOCATED",
          //     created_by: session?.pid || session?.user_id,
          //   },
          //   { transaction },
          // );

          // Create sales_inventory record with order_id
          await models.SalesInventory.create(
            {
              product_master_id: product_id,
              packing_id: null,
              order_id: orderProduct.order_id,
              quantity: allocateQuantity,
              is_active: true,
              created_by: session?.pid || session?.user_id,
            },
            { transaction },
          );

          await transaction.commit();

          allocations.push({
            order_id: orderProduct.order_id,
            order_no: orderProduct.Order.order_no,
            allocated_quantity: allocateQuantity,
            // allocation_no: allocationNo, // Not created for auto-allocation
          });

          remainingInventory -= allocateQuantity;

          console.log(
            `✅ Successfully allocated ${allocateQuantity}kg to order ${orderProduct.Order.order_no}`,
          );
        } catch (error) {
          await transaction.rollback();
          console.error(
            `❌ Error allocating to order ${orderProduct.Order.order_no}:`,
            error.message,
          );
          // Continue with next order
        }
      }

      resolve({
        statusCode: 200,
        message: `Auto-allocation completed. Processed ${allocations.length} orders.`,
        data: {
          product_id,
          total_available: totalAvailable,
          remaining_inventory: remainingInventory,
          allocations_completed: allocations.length,
          allocations: allocations,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: 500,
        message: "Error in auto-allocation",
        error: err.message,
      });
    }
  });
};

module.exports = AutoAllocateStock;
