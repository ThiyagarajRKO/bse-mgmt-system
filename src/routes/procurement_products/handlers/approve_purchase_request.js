import models from "../../../../models";
import { Update } from "./update";

export const ApprovePurchaseRequest = async (
  {
    profile_id,
    id,
    status = "Approved",
    procurement_price,
    supplier_master_id,
    ...params
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("ApprovePurchaseRequest handler called with id:", id);
      console.log(
        "ApprovePurchaseRequest - Looking up procurement product with id:",
        id,
      );

      // First, get the procurement product details with enhanced error handling
      let procurementProduct;
      try {
        procurementProduct = await models.ProcurementProducts.findByPk(id, {
          include: [
            {
              model: models.ProductMaster,
              as: "ProductMaster",
            },
            {
              model: models.SupplierMaster,
            },
          ],
        });

        if (!procurementProduct) {
          console.error(
            `[APPROVE] ❌ Procurement product not found - id: ${id}`,
          );
          console.error(`[APPROVE] Attempted findByPk() returned null`);
          console.error(`[APPROVE] Checking if record exists in database...`);

          // Additional verification: Try alternative lookup
          const alternativeLookup = await models.ProcurementProducts.findOne({
            where: { id },
            raw: true,
          });

          if (!alternativeLookup) {
            console.error(
              `[APPROVE] ❌ CRITICAL: Record does not exist in database at all - id: ${id}`,
            );
            return reject({
              statusCode: 404,
              message: `Procurement product not found - id: ${id}`,
              details: {
                id,
                lookupMethod: "findByPk",
                found: false,
              },
            });
          } else {
            console.error(
              `[APPROVE] ⚠️  Record exists but findByPk failed - possible soft-delete issue`,
            );
            console.error(
              `[APPROVE] Found via raw query: ${JSON.stringify(alternativeLookup)}`,
            );
            return reject({
              statusCode: 404,
              message: `Procurement product found but could not load associations - id: ${id}`,
              details: {
                id,
                exists: true,
                rawRecord: alternativeLookup,
              },
            });
          }
        }

        console.log(`[APPROVE] ✅ Successfully found procurement product:`, {
          id: procurementProduct.id,
          productMasterId: procurementProduct.ProductMaster?.id,
          supplierId: procurementProduct.supplier_master_id,
        });
      } catch (lookupError) {
        console.error(
          `[APPROVE] 💥 Error during procurement product lookup:`,
          lookupError.message,
        );
        console.error(`[APPROVE] Stack trace:`, lookupError.stack);
        return reject({
          statusCode: 500,
          message: `Error looking up procurement product - ${lookupError.message}`,
          details: {
            id,
            error: lookupError.message,
          },
        });
      }

      // Prepare update data with new price and supplier if provided
      const updateData = {
        status,
        approver_name: session?.user?.first_name,
      };

      if (procurement_price !== undefined) {
        updateData.procurement_price = procurement_price;
      }

      if (supplier_master_id !== undefined) {
        updateData.supplier_master_id = supplier_master_id;
      }

      console.log(
        "ApprovePurchaseRequest - Updating procurement product with data:",
        updateData,
      );
      console.log(
        "ApprovePurchaseRequest - supplier_master_id param:",
        supplier_master_id,
      );
      console.log(
        "ApprovePurchaseRequest - updateData.supplier_master_id:",
        updateData.supplier_master_id,
      );

      // Update the procurement product status to Approved
      const updateResult = await Update(
        {
          profile_id,
          procurement_product_id: id,
          procurement_product_data: updateData,
        },
        session,
        fastify,
      );

      // Use the price from the request or from the existing procurement product
      const finalPrice =
        procurement_price !== undefined
          ? procurement_price
          : procurementProduct.procurement_price || 0;

      // Use the supplier from the request or from the existing procurement product
      const finalSupplier =
        supplier_master_id || procurementProduct.supplier_master_id;

      // Update or create purchase_inventory record
      // Only set available_stock when the purchase request is APPROVED
      let purchaseInventoryRecord = await models.PurchaseInventory.findOne({
        where: {
          product_master_id: procurementProduct.product_master_id,
          procurement_product_id: id,
        },
      });

      if (purchaseInventoryRecord) {
        // Update existing record - set quantity and available_stock on approval
        await purchaseInventoryRecord.update({
          quantity: procurementProduct.procurement_quantity,
          available_stock: procurementProduct.procurement_quantity,
          supplier_master_id: finalSupplier,
          unit_price: finalPrice,
          total_amount: finalPrice * procurementProduct.procurement_quantity,
          status: "Approved",
          updated_by: profile_id,
        });

        console.log(
          "Purchase inventory record updated:",
          purchaseInventoryRecord.id,
        );
      } else {
        // Create new record if it doesn't exist
        purchaseInventoryRecord = await models.PurchaseInventory.create({
          product_master_id: procurementProduct.product_master_id,
          procurement_product_id: id,
          supplier_master_id: finalSupplier,
          quantity: procurementProduct.procurement_quantity,
          available_stock: procurementProduct.procurement_quantity,
          reserved_quantity: 0,
          unit_price: finalPrice,
          total_amount: finalPrice * procurementProduct.procurement_quantity,
          status: "Approved",
          created_by: profile_id,
          is_active: true,
        });

        console.log(
          "Purchase inventory record created:",
          purchaseInventoryRecord.id,
        );
      }

      // ALLOCATION: If this procurement is for an order, allocate the purchased inventory
      let allocationResult = null;
      if (procurementProduct.order_id) {
        console.log(
          `📦 Allocating purchased inventory for order: ${procurementProduct.order_id}`,
        );

        // Get the order details
        const order = await models.Orders.findByPk(procurementProduct.order_id);
        if (!order) {
          console.log(`⚠️ Order not found: ${procurementProduct.order_id}`);
        } else {
          // Get all order products for this order to find matching product
          const orderProducts = await models.OrderProducts.findAll({
            where: {
              order_id: procurementProduct.order_id,
              product_master_id: procurementProduct.product_master_id,
            },
          });

          if (orderProducts.length > 0) {
            // For each order product, allocate or update allocation
            for (const orderProduct of orderProducts) {
              console.log(
                `🔄 Processing order product: ${orderProduct.id}, quantity needed: ${orderProduct.quantity}`,
              );

              // Check if allocation exists for this order product
              let allocation = await models.SalesAllocation.findOne({
                where: {
                  order_id: procurementProduct.order_id,
                  order_product_id: orderProduct.id,
                },
                order: [["created_at", "DESC"]],
              });

              if (allocation) {
                // Allocation exists, update the allocated quantity
                const newAllocatedQuantity =
                  (allocation.allocated_quantity || 0) +
                  procurementProduct.procurement_quantity;
                const quantityToAllocate = Math.min(
                  newAllocatedQuantity,
                  orderProduct.quantity,
                );

                console.log(
                  `📝 Updating allocation: old=${allocation.allocated_quantity}, new=${quantityToAllocate}`,
                );

                // When purchase is approved, allocation status becomes ALLOCATED
                // (inventory is now available and allocated to the order)
                await models.SalesAllocation.update(
                  {
                    allocated_quantity: quantityToAllocate,
                    allocation_status: "ALLOCATED", // ✅ Always set to ALLOCATED on approval
                  },
                  { where: { id: allocation.id } },
                );

                console.log(
                  `✅ Allocation updated: ${allocation.id} → Status: ALLOCATED`,
                );
              } else {
                // No allocation exists, create one
                const allocateQuantity = Math.min(
                  procurementProduct.procurement_quantity,
                  orderProduct.quantity,
                );

                const newAllocation = await models.SalesAllocation.create({
                  order_id: procurementProduct.order_id,
                  order_product_id: orderProduct.id,
                  allocated_quantity: allocateQuantity,
                  ordered_quantity: orderProduct.quantity,
                  fulfilled_quantity: 0,
                  allocation_status: "ALLOCATED",
                  allocation_date: new Date(),
                  allocated_by: profile_id,
                });

                console.log(
                  `✨ New allocation created: ${newAllocation.id}, quantity: ${allocateQuantity}`,
                );
              }
            }

            allocationResult = {
              allocated: true,
              orderId: procurementProduct.order_id,
              quantity: procurementProduct.procurement_quantity,
            };
          }
        }
      } else {
        console.log(
          `⚠️ No order associated with this procurement product: ${id}`,
        );
      }

      resolve({
        message:
          "Purchase request approved successfully and added to purchase inventory",
        data: {
          procurement_product_id: id,
          purchase_inventory_id: purchaseInventoryRecord.id,
          status: "Approved",
          allocation: allocationResult,
        },
      });
    } catch (err) {
      fastify.log.error("Error in ApprovePurchaseRequest:", err);
      reject(err);
    }
  });
};
