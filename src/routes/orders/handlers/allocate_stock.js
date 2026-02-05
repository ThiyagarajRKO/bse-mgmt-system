import models from "../../../../models";

export const AllocateStock = async (
  { order_id, product_id },
  session,
  fastify,
) => {
  console.log("AllocateStock function called");
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
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
            include: [
              {
                model: models.SizeMaster,
                attributes: ["unit_of_measure"],
              },
            ],
          },
        ],
      });

      if (!orderProduct) {
        return reject({
          statusCode: 404,
          message: "Order product not found!",
        });
      }

      const parsedQuantity = parseFloat(orderProduct.quantity);
      const unitOfMeasure =
        orderProduct.ProductMaster?.SizeMaster?.unit_of_measure || "pcs";

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
        return resolve({
          message: `Order ${existingOrder.order_no} is already allocated. Redirecting to Production page.`,
          redirect: "/production",
          order_id: order_id,
          order_no: existingOrder.order_no,
        });
      }

      // Check if finished goods are available
      // Get unit IDs for Collection Center and Cold Storage (same logic as check_inventory)
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
      console.log("DEBUG: Allowed units for allocation:", allowedUnitIds);
      console.log("DEBUG: Allowed units for allocation:", allowedUnitIds);

      const fgInventory = await models.inventory_stock.findAll({
        where: {
          product_id: product_id,
          unit_id: {
            [models.Sequelize.Op.in]:
              allowedUnitIds.length > 0 ? allowedUnitIds : [null],
          },
          available_qty: {
            [models.Sequelize.Op.gt]: 0,
          },
        },
        attributes: ["id", "available_qty", "lot_id"],
        order: [["updated_at", "ASC"]], // FIFO allocation
      });

      console.log(
        "DEBUG: FG Inventory found:",
        fgInventory.length,
        "items for product:",
        product_id,
      );

      if (!fgInventory || fgInventory.length === 0) {
        console.log(
          "No finished goods available, checking purchase inventory...",
        );

        // Calculate total available finished goods (should be 0 based on above check)
        const totalFGAvailable = 0;

        // Get total available quantity in purchase inventory
        const purchaseInventorySum = await models.PurchaseInventory.findAll({
          where: {
            product_master_id: product_id,
            available_quantity: {
              [models.Sequelize.Op.gt]: 0,
              [models.Sequelize.Op.not]: null,
            },
            is_active: true,
          },
          attributes: [
            [
              models.sequelize.fn(
                "SUM",
                models.sequelize.col("available_quantity"),
              ),
              "total_available",
            ],
          ],
          raw: true,
        });

        const availableInPurchase = parseFloat(
          purchaseInventorySum[0]?.total_available || 0,
        );

        // Check if this is raw material that needs yield consideration
        const purchaseInventoryItems = await models.PurchaseInventory.findAll({
          where: {
            product_master_id: product_id,
            available_quantity: {
              [models.Sequelize.Op.gt]: 0,
              [models.Sequelize.Op.not]: null,
            },
            is_active: true,
          },
          include: [
            {
              model: models.ProcurementProducts,
              as: "ProcurementProduct",
              attributes: ["procurement_product_type"],
            },
          ],
          attributes: ["id"],
        });

        const isRawMaterial = purchaseInventoryItems.some(
          (item) =>
            item.ProcurementProduct?.procurement_product_type === "UNPROCESSED",
        );

        let effectiveAvailableQuantity = availableInPurchase;
        let requiredRawMaterials = parsedQuantity;

        if (isRawMaterial) {
          // For raw materials, calculate effective finished goods considering yield
          const YieldBasedInventoryCalculator = require("../../../services/yield_based_inventory_calculator");
          effectiveAvailableQuantity =
            await YieldBasedInventoryCalculator.calculateEffectiveInventory(
              product_id,
              availableInPurchase,
            );
          // Calculate required raw materials for the requested finished goods quantity
          requiredRawMaterials =
            await YieldBasedInventoryCalculator.calculateRequiredRawMaterials(
              product_id,
              parsedQuantity,
            );
          console.log(
            `Raw material yield adjustment: ${availableInPurchase}${unitOfMeasure} raw → ${effectiveAvailableQuantity}${unitOfMeasure} effective finished goods`,
          );
          console.log(
            `Required raw materials for ${parsedQuantity}${unitOfMeasure} finished goods: ${requiredRawMaterials}${unitOfMeasure} raw materials`,
          );
        }

        console.log(
          `Available in purchase inventory: ${availableInPurchase}${unitOfMeasure} ${isRawMaterial ? `(effective: ${effectiveAvailableQuantity}${unitOfMeasure} finished goods)` : "(finished goods)"}`,
        );

        if (effectiveAvailableQuantity >= parsedQuantity) {
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
              await models.PurchaseInventory.findAll({
                where: {
                  product_master_id: product_id,
                  available_quantity: {
                    [models.Sequelize.Op.gt]: 0,
                    [models.Sequelize.Op.not]: null,
                  },
                  is_active: true,
                },
                attributes: ["id", "available_quantity"],
                order: [["created_at", "ASC"]], // FIFO allocation
                transaction,
              });

            // Allocate from purchase inventory lots (FIFO)
            for (const inventory of purchaseInventoryItems) {
              if (remainingQuantity <= 0) break;

              const allocateQty = Math.min(
                remainingQuantity,
                parseFloat(inventory.available_quantity),
              );

              if (isNaN(allocateQty) || allocateQty <= 0) {
                console.error(
                  "Invalid allocateQty:",
                  allocateQty,
                  "remainingQuantity:",
                  remainingQuantity,
                  "available_quantity:",
                  inventory.available_quantity,
                );
                continue; // Skip this inventory item
              }

              // Create sales inventory allocation record
              await models.SalesInventory.create(
                {
                  order_id: order_id,
                  product_master_id: product_id,
                  quantity: allocateQty,
                  created_by: session?.pid || "system",
                },
                { transaction },
              );

              // Update purchase inventory (reduce available quantity)
              await models.PurchaseInventory.update(
                {
                  available_quantity:
                    parseFloat(inventory.available_quantity) - allocateQty,
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
              message: `Stock allocated successfully from purchase inventory. ${parsedQuantity} ${unitOfMeasure} allocated.`,
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
          // Calculate raw material stock availability
          const rawMaterialItems = await models.PurchaseInventory.findAll({
            where: {
              product_master_id: product_id,
              available_quantity: {
                [models.Sequelize.Op.gt]: 0,
              },
              is_active: true,
            },
            attributes: [
              [
                models.sequelize.fn(
                  "SUM",
                  models.sequelize.col("available_quantity"),
                ),
                "total_raw_material",
              ],
            ],
            raw: true,
          });

          const rawMaterialStock = parseFloat(
            rawMaterialItems[0]?.total_raw_material || 0,
          );

          // Instead of rejecting, trigger procurement for raw materials
          console.log(
            "Insufficient inventory, triggering procurement for raw materials...",
          );

          try {
            const PurchaseRequestService = require("../../../../services/PurchaseRequestService");

            // Create inventory details for the service
            const inventoryDetails = {
              [product_id]: availableInPurchase, // Current purchase inventory
            };

            // Trigger procurement for raw materials needed
            const procurementResult =
              await PurchaseRequestService.createPurchaseRequest(
                product_id,
                parsedQuantity,
                order_id,
                inventoryDetails,
              );

            // Update order status to indicate procurement is in progress
            await models.Orders.update(
              {
                order_status: "PROCUREMENT_PENDING",
                allocation_status: "Procurement Initiated",
                updated_at: new Date(),
              },
              {
                where: { id: order_id },
              },
            );

            return resolve({
              message: `Procurement initiated for raw materials. ${procurementResult.procurementCreated?.length || 0} procurement requests created.`,
              procurementTriggered: true,
              procurementResult,
            });
          } catch (procurementError) {
            console.error("Error triggering procurement:", procurementError);
            return reject({
              statusCode: 500,
              message: `Failed to initiate procurement: ${procurementError.message}`,
            });
          }
        }
      }

      // Calculate total available quantity
      const totalAvailable = fgInventory.reduce(
        (sum, inv) => sum + parseFloat(inv.available_qty),
        0,
      );

      if (totalAvailable < parsedQuantity) {
        // Check raw material stock availability
        const rawMaterialItems = await models.PurchaseInventory.findAll({
          where: {
            product_master_id: product_id,
            available_quantity: {
              [models.Sequelize.Op.gt]: 0,
            },
            is_active: true,
          },
          include: [
            {
              model: models.ProcurementProducts,
              as: "ProcurementProduct",
              attributes: ["procurement_product_type"],
            },
          ],
          attributes: [
            [
              models.sequelize.fn(
                "SUM",
                models.sequelize.col("available_quantity"),
              ),
              "total_raw_material",
            ],
          ],
          raw: true,
        });

        const rawMaterialStock = parseFloat(
          rawMaterialItems[0]?.total_raw_material || 0,
        );

        // Calculate required raw materials if this is a raw material product
        let requiredRawMaterialsForError = parsedQuantity;
        if (isRawMaterial) {
          const YieldBasedInventoryCalculator = require("../../../services/yield_based_inventory_calculator");
          requiredRawMaterialsForError =
            await YieldBasedInventoryCalculator.calculateRequiredRawMaterials(
              product_id,
              parsedQuantity,
            );
        }

        // Instead of rejecting, trigger procurement for raw materials
        console.log(
          "Insufficient finished goods stock, triggering procurement for raw materials...",
        );

        try {
          const PurchaseRequestService = require("../../../../services/PurchaseRequestService");

          // Create inventory details for the service
          const inventoryDetails = {
            [product_id]: totalAvailable, // Current finished goods inventory
          };

          // Trigger procurement for raw materials needed
          const procurementResult =
            await PurchaseRequestService.createPurchaseRequest(
              product_id,
              parsedQuantity,
              order_id,
              inventoryDetails,
            );

          // Update order status to indicate procurement is in progress
          await models.Orders.update(
            {
              order_status: "PROCUREMENT_PENDING",
              allocation_status: "Procurement Initiated",
              updated_at: new Date(),
            },
            {
              where: { id: order_id },
            },
          );

          return resolve({
            message: `Procurement initiated for raw materials. ${procurementResult.procurementCreated?.length || 0} procurement requests created.`,
            procurementTriggered: true,
            procurementResult,
          });
        } catch (procurementError) {
          console.error("Error triggering procurement:", procurementError);
          return reject({
            statusCode: 500,
            message: `Failed to initiate procurement: ${procurementError.message}`,
          });
        }
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
              uom: unitOfMeasure.toUpperCase(), // Required field
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
              allocated_quantity: parsedQuantity,
              allocated_unit: unitOfMeasure.toUpperCase(), // Using actual unit of measure
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
              quantity: parsedQuantity,
              is_active: true,
              created_by: session?.pid || session?.user_id,
            },
            { transaction },
          );
        }

        await transaction.commit();

        resolve({
          statusCode: 200,
          message: `Stock allocated successfully from finished goods. ${parsedQuantity} ${unitOfMeasure} allocated.`,
          data: {
            order_id,
            product_id,
            allocated_quantity: parsedQuantity,
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
