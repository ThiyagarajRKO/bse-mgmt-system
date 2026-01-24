const models = require("../../../../models");

export const AutoAllocateStock = async ({ product_id }, session, fastify) => {
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

      // Get unit IDs for Collection Center and Cold Storage
      const allowedUnits = await models.UnitMaster.findAll({
        where: {
          unit_type: {
            [models.Sequelize.Op.in]: ["Collection Center", "Cold Storage"],
          },
          is_active: true,
        },
        attributes: ["id"],
      });

      const allowedUnitIds = allowedUnits.map((unit) => unit.id);

      console.log(
        `🔍 Found ${allowedUnitIds.length} allowed units: ${allowedUnitIds.join(", ")}`,
      );

      // Get total available FG for this product (only from Collection Center or Cold Storage)
      const fgInventory = await models.inventory_stock.findAll({
        where: {
          product_id: product_id,
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
          unit_id: {
            [models.Sequelize.Op.in]: allowedUnitIds,
          },
        },
        attributes: ["id", "available_qty", "lot_id"],
        order: [["updated_at", "ASC"]], // FIFO allocation
      });

      if (!fgInventory || fgInventory.length === 0) {
        console.log(`📦 No FG available, checking purchase inventory...`);
        // Check purchase inventory and create purchase orders if needed
        return await checkPurchaseInventoryAndCreateOrders(
          { product_id },
          session,
          fastify,
          resolve,
          reject,
        );
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
            [models.Sequelize.Op.or]: [
              { [models.Sequelize.Op.ne]: "ALLOCATED" },
              { [models.Sequelize.Op.is]: null },
            ],
          },
          is_active: true,
        },
        include: [
          {
            model: models.Orders,
            as: "Order",
            where: {
              order_status: {
                [models.Sequelize.Op.or]: [
                  { [models.Sequelize.Op.ne]: "ALLOCATED" },
                  { [models.Sequelize.Op.is]: null },
                ],
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

// Helper function to check purchase inventory and create purchase orders if needed
const checkPurchaseInventoryAndCreateOrders = async (
  { product_id },
  session,
  fastify,
  resolve,
  reject,
) => {
  try {
    console.log(`🔍 Checking purchase inventory for product: ${product_id}`);

    // Find pending orders for this product
    const pendingOrders = await models.OrderProducts.findAll({
      where: {
        product_master_id: product_id,
        delivery_status: {
          [models.Sequelize.Op.or]: [
            { [models.Sequelize.Op.ne]: "ALLOCATED" },
            { [models.Sequelize.Op.is]: null },
          ],
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
      order: [["created_at", "ASC"]],
    });

    if (pendingOrders.length === 0) {
      return resolve({
        statusCode: 200,
        message: "No pending orders found for this product",
        data: {
          product_id,
          total_available: 0,
          pending_orders: 0,
        },
      });
    }

    const totalRequired = pendingOrders.reduce(
      (sum, order) => sum + parseFloat(order.quantity),
      0,
    );

    console.log(
      `📋 Total quantity required: ${totalRequired}kg across ${pendingOrders.length} orders`,
    );

    // Check available quantity in purchase inventory
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

    console.log(`📦 Available in purchase inventory: ${availableInPurchase}kg`);

    if (availableInPurchase >= totalRequired) {
      // Enough in purchase inventory, allocate from there
      console.log(
        `✅ Sufficient quantity in purchase inventory, allocating...`,
      );
      return await allocateFromPurchaseInventory(
        pendingOrders,
        product_id,
        session,
        resolve,
        reject,
      );
    } else {
      // Not enough in purchase inventory, create purchase orders
      const shortage = totalRequired - availableInPurchase;
      console.log(`⚠️ Shortage of ${shortage}kg, creating purchase orders...`);

      const purchaseOrders = await createPurchaseOrders(
        pendingOrders,
        product_id,
        shortage,
        session,
      );

      return resolve({
        statusCode: 200,
        message: `Procurement initiated for ${shortage}kg shortage. ${availableInPurchase}kg available in purchase inventory.`,
        data: {
          product_id,
          total_required: totalRequired,
          available_in_purchase: availableInPurchase,
          shortage: shortage,
          procurement_initiated: purchaseOrders.length,
          procurement_details: purchaseOrders,
          status: "PENDING_PROCUREMENT",
        },
      });
    }
  } catch (err) {
    fastify.log.error(err);
    reject({
      statusCode: 500,
      message: "Error checking purchase inventory",
      error: err.message,
    });
  }
};

// Helper function to allocate from purchase inventory
const allocateFromPurchaseInventory = async (
  pendingOrders,
  product_id,
  session,
  resolve,
  reject,
) => {
  try {
    const transaction = await models.sequelize.transaction();
    const allocations = [];

    try {
      // Get purchase inventory items
      const purchaseInventoryItems = await models.purchase_inventory.findAll({
        where: {
          product_master_id: product_id,
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
          is_active: true,
        },
        order: [["created_at", "ASC"]],
        transaction,
      });

      let remainingToAllocate = pendingOrders.reduce(
        (sum, order) => sum + parseFloat(order.quantity),
        0,
      );

      // Allocate to orders
      for (const orderProduct of pendingOrders) {
        if (remainingToAllocate <= 0) break;

        const orderQuantity = parseFloat(orderProduct.quantity);
        const allocateQuantity = Math.min(orderQuantity, remainingToAllocate);

        // Create sales_inventory record for allocation
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

        // Update purchase inventory (reduce available quantity)
        let allocatedFromPurchase = 0;
        for (const purchaseItem of purchaseInventoryItems) {
          if (allocatedFromPurchase >= allocateQuantity) break;

          const availableQty = parseFloat(purchaseItem.available_qty);
          if (availableQty <= 0) continue;

          const allocateFromThisItem = Math.min(
            allocateQuantity - allocatedFromPurchase,
            availableQty,
          );

          await purchaseItem.update(
            {
              available_qty: availableQty - allocateFromThisItem,
              updated_at: new Date(),
            },
            { transaction },
          );

          allocatedFromPurchase += allocateFromThisItem;
        }

        // Update order status to READY_FOR_PRODUCTION
        await models.Orders.update(
          {
            order_status: "READY_FOR_PRODUCTION",
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
            delivery_status: "READY_FOR_PRODUCTION",
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

        allocations.push({
          order_id: orderProduct.order_id,
          order_no: orderProduct.Order.order_no,
          allocated_quantity: allocateQuantity,
        });

        remainingToAllocate -= allocateQuantity;

        console.log(
          `✅ Allocated ${allocateQuantity}kg to order ${orderProduct.Order.order_no} from purchase inventory`,
        );
      }

      await transaction.commit();

      resolve({
        statusCode: 200,
        message: `Successfully allocated from purchase inventory. Orders are ready for production.`,
        data: {
          product_id,
          allocations_completed: allocations.length,
          allocations: allocations,
          status: "READY_FOR_PRODUCTION",
          message:
            "Click 'Begin Production' button to start production process",
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error(
        `❌ Error allocating from purchase inventory:`,
        error.message,
      );
      throw error;
    }
  } catch (err) {
    reject({
      statusCode: 500,
      message: "Error allocating from purchase inventory",
      error: err.message,
    });
  }
};

// Helper function to create purchase orders
const createPurchaseOrders = async (
  pendingOrders,
  product_id,
  shortage,
  session,
) => {
  const transaction = await models.sequelize.transaction();
  const createdOrders = [];

  try {
    // Get product details
    const product = await models.ProductMaster.findByPk(product_id, {
      attributes: ["id", "product_name"],
      transaction,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Create procurement lot first
    const lotNo = `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const procurementLot = await models.ProcurementLots.create(
      {
        lot_no: lotNo,
        procurement_date: new Date(),
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: "PENDING",
        total_quantity: shortage,
        created_by: session?.pid || session?.user_id,
      },
      { transaction },
    );

    // Create procurement product
    await models.ProcurementProducts.create(
      {
        procurement_lot_id: procurementLot.id,
        supplier_master_id: null, // To be assigned later
        product_master_id: product_id,
        procurement_product_type: "RAW_MATERIAL",
        procurement_quantity: shortage,
        procurement_price: 0, // To be set later
        order_id: pendingOrders[0]?.order_id, // Link to first order
        is_active: true,
        created_by: session?.pid || session?.user_id,
      },
      { transaction },
    );

    // Update order status to PENDING_PROCUREMENT
    for (const orderProduct of pendingOrders) {
      await models.Orders.update(
        {
          order_status: "PENDING_PROCUREMENT",
          updated_at: new Date(),
        },
        {
          where: { id: orderProduct.order_id, is_active: true },
          transaction,
        },
      );

      await models.OrderProducts.update(
        {
          delivery_status: "PENDING_PROCUREMENT",
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
    }

    await transaction.commit();

    createdOrders.push({
      procurement_lot_id: procurementLot.id,
      lot_no: lotNo,
      product_name: product.product_name,
      quantity: shortage,
    });

    console.log(
      `✅ Created procurement lot ${lotNo} for ${shortage}kg of ${product.product_name}`,
    );

    return createdOrders;
  } catch (error) {
    await transaction.rollback();
    console.error(`❌ Error creating procurement:`, error.message);
    throw error;
  }
};
