import models from "../../../../models";

export const AllocateStock = async (
  { order_id, product_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("AllocateStock called with params:", {
        order_id,
        product_id,
      });

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

      // Fetch the quantity from the order_products table
      const orderProduct = await models.OrderProducts.findOne({
        where: {
          order_id: order_id,
          product_master_id: product_id,
          is_active: true,
        },
        attributes: ["quantity"],
      });

      if (!orderProduct) {
        return reject({
          statusCode: 404,
          message: "Order product not found!",
        });
      }

      const parsedQuantity = parseFloat(orderProduct.quantity);

      if (parsedQuantity <= 0) {
        return reject({
          statusCode: 400,
          message: "Order quantity must be greater than 0!",
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
          unit_id: {
            [models.Sequelize.Op.iLike]: "%fg%", // Finished goods inventory
          },
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
        },
        attributes: ["id", "available_qty", "lot_id"],
        order: [["created_at", "ASC"]], // FIFO allocation
      });

      if (!fgInventory || fgInventory.length === 0) {
        console.log(
          "No finished goods available, checking purchase inventory...",
        );

        // Check purchase inventory as fallback
        const purchaseInventory = await models.purchase_inventory.findAll({
          where: {
            product_master_id: product_id,
            available_qty: {
              [models.Sequelize.Op.gt]: 0,
            },
            is_active: true,
          },
          attributes: [
            [
              models.sequelize.fn("SUM", models.sequelize.col("available_qty")),
              "total_available",
            ],
          ],
          raw: true,
        });

        const availableInPurchase = parseFloat(
          purchaseInventory[0]?.total_available || 0,
        );

        console.log(
          `Available in purchase inventory: ${availableInPurchase}kg`,
        );

        if (availableInPurchase >= parsedQuantity) {
          // Enough in purchase inventory, allocate from there
          console.log(
            "Sufficient quantity in purchase inventory, allocating...",
          );

          // Start transaction for allocation from purchase inventory
          const transaction = await models.sequelize.transaction();

          try {
            let remainingQuantity = parsedQuantity;

            // Get purchase inventory items ordered by FIFO
            const purchaseInventoryItems =
              await models.purchase_inventory.findAll({
                where: {
                  product_master_id: product_id,
                  available_qty: {
                    [models.Sequelize.Op.gt]: 0,
                  },
                  is_active: true,
                },
                attributes: [
                  "id",
                  "available_qty",
                  "lot_id",
                  "procurement_lot_id",
                ],
                order: [["created_at", "ASC"]], // FIFO allocation
                transaction,
              });

            // Allocate from purchase inventory lots (FIFO)
            for (const inventory of purchaseInventoryItems) {
              if (remainingQuantity <= 0) break;

              const allocateQty = Math.min(
                remainingQuantity,
                parseFloat(inventory.available_qty),
              );

              // Create sales inventory allocation record
              await models.sales_inventory.create(
                {
                  order_id: order_id,
                  product_master_id: product_id,
                  quantity: allocateQty,
                  unit_id: "kg", // Assuming kg as default unit
                  lot_id: inventory.lot_id,
                  procurement_lot_id: inventory.procurement_lot_id,
                  allocation_type: "PURCHASE_INVENTORY",
                  created_by: session?.pid || "system",
                },
                { transaction },
              );

              // Update purchase inventory (reduce available quantity)
              await models.purchase_inventory.update(
                {
                  available_qty:
                    parseFloat(inventory.available_qty) - allocateQty,
                  updated_at: new Date(),
                },
                {
                  where: { id: inventory.id },
                  transaction,
                },
              );

              remainingQuantity -= allocateQty;
            }

            // Update order status to allocated
            await models.Orders.update(
              {
                order_status: "ALLOCATED",
                allocation_status: "Allocated",
                updated_at: new Date(),
              },
              {
                where: { id: order_id },
                transaction,
              },
            );

            // Update order product delivery status
            await models.OrderProducts.update(
              {
                delivery_status: "ALLOCATED",
                updated_at: new Date(),
              },
              {
                where: {
                  order_id: order_id,
                  product_master_id: product_id,
                },
                transaction,
              },
            );

            await transaction.commit();

            return resolve({
              message: `Stock allocated successfully from purchase inventory. ${parsedQuantity} kg allocated.`,
            });
          } catch (error) {
            await transaction.rollback();
            console.error("Error allocating from purchase inventory:", error);
            return reject({
              statusCode: 500,
              message: "Error allocating stock from purchase inventory",
            });
          }
        } else {
          return reject({
            statusCode: 400,
            message: `No inventory available for allocation. Finished goods: 0 kg, Purchase inventory: ${availableInPurchase} kg, Required: ${parsedQuantity} kg`,
          });
        }
      }

      // Calculate total available quantity
      const totalAvailable = fgInventory.reduce(
        (sum, inv) => sum + parseFloat(inv.available_qty),
        0,
      );

      if (totalAvailable < parsedQuantity) {
        return reject({
          statusCode: 400,
          message: `Insufficient finished goods stock. Available: ${totalAvailable} kg, Required: ${parsedQuantity} kg`,
        });
      }

      // Start transaction for allocation
      const transaction = await models.sequelize.transaction();

      try {
        let remainingQuantity = parsedQuantity;

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
