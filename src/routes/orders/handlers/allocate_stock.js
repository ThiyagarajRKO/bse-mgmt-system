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
          "No finished goods available, checking purchase inventory for raw materials...",
        );

        // Calculate total available finished goods (should be 0 based on above check)
        const totalFGAvailable = 0;

        // Get BOM entries to find raw materials for this finished product
        const bomEntries = await models.BillOfMaterials.findAll({
          where: {
            product_master_id: product_id,
            is_active: true,
          },
          include: [
            {
              model: models.ProcurementProducts,
              as: "ProcurementProduct",
              attributes: ["product_master_id"],
              required: false,
            },
          ],
          raw: false,
        });

        // Extract raw material IDs from BOM
        const rawMaterialIds = bomEntries
          .map((bom) => bom.ProcurementProduct?.product_master_id)
          .filter((id) => id);

        console.log(
          `Found ${rawMaterialIds.length} raw materials in BOM for finished product ${product_id}`,
        );

        // Get total available quantity in purchase inventory for raw materials
        const purchaseInventorySum = await models.PurchaseInventory.findAll({
          where: {
            product_master_id: {
              [models.Sequelize.Op.in]:
                rawMaterialIds.length > 0 ? rawMaterialIds : [product_id], // Fallback to direct lookup if no BOM
            },
            quantity: {
              [models.Sequelize.Op.gt]: 0,
              [models.Sequelize.Op.not]: null,
            },
            is_active: true,
          },
          attributes: [
            [
              models.sequelize.fn("SUM", models.sequelize.col("quantity")),
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
            product_master_id: {
              [models.Sequelize.Op.in]:
                rawMaterialIds.length > 0 ? rawMaterialIds : [product_id], // Fallback to direct lookup if no BOM
            },
            quantity: {
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

        // by default consider entire purchase inventory availability
        let effectiveAvailableQuantity = availableInPurchase;
        let requiredRawMaterials = parsedQuantity;

        if (isRawMaterial) {
          // Treat raw material stock directly as usable units for allocation
          // (do **not** convert via yield here - allocation is based on physical
          // raw material quantity rather than yield-adjusted finished goods).
          effectiveAvailableQuantity = availableInPurchase;
          requiredRawMaterials = parsedQuantity;

          console.log(
            `[AllocateStock] Raw material allocation logic - using physical stock: ${availableInPurchase}${unitOfMeasure} available, need ${parsedQuantity}${unitOfMeasure}`,
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

            // Get purchase inventory items ordered by FIFO (for raw materials)
            const purchaseInventoryItems =
              await models.PurchaseInventory.findAll({
                where: {
                  product_master_id: {
                    [models.Sequelize.Op.in]:
                      rawMaterialIds.length > 0 ? rawMaterialIds : [product_id], // Fallback if no BOM
                  },
                  quantity: {
                    [models.Sequelize.Op.gt]: 0,
                    [models.Sequelize.Op.not]: null,
                  },
                  is_active: true,
                },
                attributes: ["id", "quantity", "product_master_id"],
                order: [["created_at", "ASC"]], // FIFO allocation
                transaction,
              });

            // Allocate from purchase inventory lots (FIFO)
            for (const inventory of purchaseInventoryItems) {
              if (remainingQuantity <= 0) break;

              const allocateQty = Math.min(
                remainingQuantity,
                parseFloat(inventory.quantity),
              );

              if (isNaN(allocateQty) || allocateQty <= 0) {
                console.error(
                  "Invalid allocateQty:",
                  allocateQty,
                  "remainingQuantity:",
                  remainingQuantity,
                  "quantity:",
                  inventory.quantity,
                );
                continue; // Skip this inventory item
              }

              // ✅ CORRECTED: Create ProductionOrder instead of SalesInventory
              // Raw materials are being allocated, so production is needed
              // SalesInventory should ONLY be created after production completes

              const productionOrderNo = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

              // `production_orders` is the actual model name registered in db/index
              await models.production_orders.create(
                {
                  // some environments still expect order_no field; supply both
                  order_no: productionOrderNo,
                  order_number: productionOrderNo,
                  order_id: order_id,
                  plant_id: "PLANT_001",
                  input_species_id: inventory.product_master_id || product_id,
                  planned_quantity_kg: allocateQty,
                  planned_start_date: new Date(),
                  status: "PLANNED",
                  created_by: session?.pid || "system",
                  remarks: `Production order for sales order allocation. Raw material quantity: ${allocateQty}`,
                },
                { transaction },
              );

              // Update purchase inventory (reserve quantity for production)
              // Reserve the allocated quantity, reducing available_stock
              await models.PurchaseInventory.update(
                {
                  reserved_quantity:
                    parseFloat(inventory.reserved_quantity || 0) + allocateQty,
                  available_stock: Math.max(
                    0,
                    parseFloat(inventory.available_stock || 0) - allocateQty,
                  ),
                  updated_at: new Date(),
                },
                {
                  where: { id: inventory.id },
                  transaction,
                },
              );

              remainingQuantity -= allocateQty;
            }

            // Update order status to IN_PRODUCTION (raw materials allocated, manufacturing in progress)
            await models.Orders.update(
              {
                order_status: "IN_PRODUCTION",
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

            // Create or update SalesAllocation to mark as ALLOCATED
            const orderProduct = await models.OrderProducts.findOne({
              where: {
                order_id: order_id,
                product_master_id: product_id,
                is_active: true,
              },
              attributes: ["id"],
              transaction,
            });

            if (orderProduct) {
              // Check if SalesAllocation already exists
              const existingSalesAllocation =
                await models.SalesAllocation.findOne({
                  where: {
                    order_id: order_id,
                    order_product_id: orderProduct.id,
                  },
                  transaction,
                });

              if (existingSalesAllocation) {
                // Update existing allocation
                await models.SalesAllocation.update(
                  {
                    allocation_status: "ALLOCATED",
                    allocated_quantity: parsedQuantity,
                    allocation_date: new Date(),
                    updated_at: new Date(),
                  },
                  {
                    where: { id: existingSalesAllocation.id },
                    transaction,
                  },
                );
                console.log(
                  `Updated SalesAllocation ${existingSalesAllocation.id} to ALLOCATED status`,
                );
              } else {
                // Create new SalesAllocation
                await models.SalesAllocation.create(
                  {
                    order_id: order_id,
                    order_product_id: orderProduct.id,
                    allocation_status: "ALLOCATED",
                    allocated_quantity: parsedQuantity,
                    ordered_quantity: parsedQuantity,
                    allocation_date: new Date(),
                    allocated_by: session?.pid || "system",
                    inventory_details: {
                      allocation_type: "raw_materials",
                      allocated_from: "purchase_inventory",
                      total_allocated: parsedQuantity,
                    },
                  },
                  { transaction },
                );
                console.log(
                  `Created new SalesAllocation for order ${order_id} with ALLOCATED status`,
                );
              }
            }

            await transaction.commit();

            return resolve({
              message: `Stock allocated successfully from purchase inventory. ${parsedQuantity} ${unitOfMeasure} allocated.`,
            });
          } catch (error) {
            await transaction.rollback();
            console.error("Error allocating from purchase inventory:", error);
            return reject({
              statusCode: 500,
              message: `Error allocating stock from purchase inventory: ${error.message}`,
              debug: error.stack,
            });
          }
        } else {
          // Calculate raw material stock availability
          const rawMaterialItems = await models.PurchaseInventory.findAll({
            where: {
              product_master_id: {
                [models.Sequelize.Op.in]:
                  rawMaterialIds.length > 0 ? rawMaterialIds : [product_id], // Fallback if no BOM
              },
              quantity: {
                [models.Sequelize.Op.gt]: 0,
              },
              is_active: true,
            },
            attributes: [
              [
                models.sequelize.fn("SUM", models.sequelize.col("quantity")),
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
            // Map raw material IDs to their current inventory quantities
            const inventoryDetails = {};
            for (const rawMatId of rawMaterialIds) {
              inventoryDetails[rawMatId] = 0; // Raw materials have no existing inventory
            }

            // Trigger procurement for raw materials needed
            const procurementResult =
              await PurchaseRequestService.createPurchaseRequest(
                product_id,
                parsedQuantity,
                order_id,
                inventoryDetails,
              );

            // Count successful procurement records created
            const procurementCount = Array.isArray(procurementResult)
              ? procurementResult.filter((r) => r !== null).length
              : procurementResult
                ? 1
                : 0;

            // Update order status to indicate procurement is in progress
            const allocationStatus =
              procurementCount > 0
                ? `Procurement Created (${procurementCount} requests)`
                : "Procurement Failed";

            await models.Orders.update(
              {
                order_status: "CONFIRMED",
                updated_at: new Date(),
              },
              {
                where: { id: order_id },
              },
            );

            return resolve({
              message:
                procurementCount > 0
                  ? `Procurement created successfully. ${procurementCount} procurement requests initiated.`
                  : "Failed to create procurement records.",
              procurementTriggered: procurementCount > 0,
              procurementCount,
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
          // Map raw material IDs to their current inventory quantities (0 since we're creating new procurement)
          const inventoryDetails = {};
          for (const rawMatId of rawMaterialIds) {
            inventoryDetails[rawMatId] = 0; // Raw materials have no existing inventory in this scenario
          }

          // Trigger procurement for raw materials needed
          const procurementResult =
            await PurchaseRequestService.createPurchaseRequest(
              product_id,
              parsedQuantity,
              order_id,
              inventoryDetails,
            );

          // Count successful procurement records created
          const procurementCount = Array.isArray(procurementResult)
            ? procurementResult.filter((r) => r !== null).length
            : procurementResult
              ? 1
              : 0;

          // Update order status to indicate procurement is in progress
          const allocationStatus =
            procurementCount > 0
              ? `Procurement Created (${procurementCount} requests)`
              : "Procurement Failed";

          await models.Orders.update(
            {
              order_status: "CONFIRMED",
              updated_at: new Date(),
            },
            {
              where: { id: order_id },
            },
          );

          return resolve({
            message:
              procurementCount > 0
                ? `Procurement created successfully. ${procurementCount} procurement requests initiated.`
                : "Failed to create procurement records.",
            procurementTriggered: procurementCount > 0,
            procurementCount,
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

          // Create or update SalesAllocation to mark as ALLOCATED
          const existingSalesAllocation = await models.SalesAllocation.findOne({
            where: {
              order_id: order_id,
              order_product_id: orderProduct.id,
            },
            transaction,
          });

          if (existingSalesAllocation) {
            // Update existing allocation
            await models.SalesAllocation.update(
              {
                allocation_status: "ALLOCATED",
                allocated_quantity: parsedQuantity,
                allocation_date: new Date(),
                updated_at: new Date(),
              },
              {
                where: { id: existingSalesAllocation.id },
                transaction,
              },
            );
            console.log(
              `Updated SalesAllocation ${existingSalesAllocation.id} to ALLOCATED status`,
            );
          } else {
            // Create new SalesAllocation
            await models.SalesAllocation.create(
              {
                order_id: order_id,
                order_product_id: orderProduct.id,
                allocation_status: "ALLOCATED",
                allocated_quantity: parsedQuantity,
                ordered_quantity: parsedQuantity,
                allocation_date: new Date(),
                allocated_by: session?.pid || "system",
                inventory_details: {
                  allocation_type: "finished_goods",
                  allocation_no: allocationNo,
                  total_allocated: parsedQuantity,
                },
              },
              { transaction },
            );
            console.log(
              `Created new SalesAllocation for order ${order_id} with ALLOCATED status`,
            );
          }
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
