import models from "../../../../models";

export const AllocateStock = async (
  { order_id, product_id, quantity },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        return reject({
          statusCode: 420,
          message: "Order ID must not be empty!",
        });
      }

      if (!product_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      if (!quantity || quantity <= 0) {
        return reject({
          statusCode: 420,
          message: "Quantity must be greater than 0!",
        });
      }

      // Check if order is already allocated
      const existingOrder = await models.Orders.findOne({
        where: {
          id: order_id,
          is_active: true,
          order_status: "ALLOCATED",
        },
        attributes: ["id", "order_no", "order_status"],
      });

      if (existingOrder) {
        return reject({
          statusCode: 400,
          message: `Order ${existingOrder.order_no} is already allocated and cannot be allocated again.`,
        });
      }

      // Check if finished goods are available
      const fgInventory = await models.inventory_stock.findAll({
        where: {
          product_id: product_id,
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
        },
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
        attributes: ["id", "available_qty", "lot_id"],
        order: [["created_at", "ASC"]], // FIFO allocation
      });

      if (!fgInventory || fgInventory.length === 0) {
        return reject({
          statusCode: 400,
          message: "No finished goods available for allocation",
        });
      }

      // Calculate total available quantity
      const totalAvailable = fgInventory.reduce(
        (sum, inv) => sum + parseFloat(inv.available_qty),
        0,
      );

      if (totalAvailable < quantity) {
        return reject({
          statusCode: 400,
          message: `Insufficient finished goods stock. Available: ${totalAvailable} kg, Required: ${quantity} kg`,
        });
      }

      // Start transaction for allocation
      const transaction = await models.sequelize.transaction();

      try {
        let remainingQuantity = quantity;

        // Allocate from inventory lots (FIFO)
        for (const inventory of fgInventory) {
          if (remainingQuantity <= 0) break;

          const allocateQty = Math.min(
            remainingQuantity,
            parseFloat(inventory.available_qty),
          );

          // Create inventory transaction for allocation
          await models.inventory_transaction.create(
            {
              stock_id: inventory.id, // Use inventory.id, not inventory.stock_id
              product_id: product_id,
              transaction_type: "DISPATCH", // Using DISPATCH for allocation
              qty_change: -allocateQty, // Negative for outbound
              uom: "KG", // Required field
              reference_type: "SALES_ORDER",
              reference_id: order_id,
              warehouse_from: "CS_UNIT",
              notes: `Allocated to order`,
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
                  parseFloat(currentStock.reserved_qty) + allocateQty,
                available_qty:
                  parseFloat(currentStock.available_qty) - allocateQty,
                updated_at: new Date(),
              },
              { transaction },
            );
          }

          remainingQuantity -= allocateQty;
        }

        // Update order status to ALLOCATED
        await models.Orders.update(
          {
            order_status: "ALLOCATED",
            updated_at: new Date(),
          },
          {
            where: { id: order_id, is_active: true },
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
              order_id: order_id,
              product_master_id: product_id,
              is_active: true,
            },
            transaction,
          },
        );

        // Find the order product to get order_product_id for allocation_master
        const orderProduct = await models.OrderProducts.findOne({
          where: {
            order_id: order_id,
            product_master_id: product_id,
            is_active: true,
          },
          transaction,
        });

        // Create allocation_master record
        if (orderProduct) {
          const allocationNo = `ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          await models.AllocationMaster.create(
            {
              allocation_no: allocationNo,
              order_id: order_id,
              order_product_id: orderProduct.id,
              packing_id: null, // Allow null for inventory allocations
              allocated_quantity: quantity,
              allocated_unit: "KG", // Assuming KG as default unit
              allocation_date: new Date(),
              status: "ALLOCATED",
              created_by: session?.pid || session?.user_id,
            },
            { transaction },
          );

          // Create sales_inventory record for this allocation
          await models.SalesInventory.create(
            {
              product_master_id: product_id,
              packing_id: null, // Allow null for inventory allocations
              order_id: order_id,
              quantity: quantity,
              is_active: true,
              created_by: session?.pid || session?.user_id,
            },
            { transaction },
          );
        }

        await transaction.commit();

        resolve({
          statusCode: 200,
          message: "Stock allocated successfully",
          data: {
            order_id,
            product_id,
            allocated_quantity: quantity,
          },
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: 500,
        message: "Error allocating stock",
        error: err.message,
      });
    }
  });
};
