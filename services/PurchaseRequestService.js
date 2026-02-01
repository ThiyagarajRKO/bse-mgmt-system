"use strict";

const db = require("../models");
const { v4: uuidv4 } = require("uuid");

class PurchaseRequestService {
  /**
   * Create purchase request for missing raw materials using yield-enhanced calculations
   * @param {string} productId - Finished product ID that needs raw materials
   * @param {number} requiredQuantity - Quantity of finished product needed
   * @param {string} orderId - Order ID for reference
   * @param {Object} inventoryDetails - Inventory check details
   * @returns {Promise<Object>} Created purchase request details
   */
  async createPurchaseRequest(
    productId,
    requiredQuantity,
    orderId,
    inventoryDetails,
  ) {
    try {
      console.log(
        `Creating purchase request for product ${productId}, quantity: ${requiredQuantity}`,
      );

      // Get product details
      const product = await db.ProductMaster.findByPk(productId, {
        include: [
          {
            model: db.SpeciesMaster,
            as: "SpeciesMaster",
          },
          {
            model: db.ProductCategoryMaster,
            as: "ProductCategoryMaster",
          },
        ],
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      console.log(
        `Looking for BOM with species_id: ${product.species_master_id}`,
      );

      // Get BOM to identify required raw materials
      const bom = await db.BomMaster.findOne({
        where: {
          species_id: product.species_master_id,
          is_active: true,
        },
        include: [
          {
            model: db.BomInput,
            as: "inputs",
          },
        ],
      });

      console.log(`BOM found: ${!!bom}`);
      if (bom) {
        console.log(`BOM inputs: ${bom.inputs?.length || 0}`);
      }

      if (!bom || !bom.inputs || bom.inputs.length === 0) {
        throw new Error(`No BOM found for product ${productId}`);
      }

      // Get raw product details separately to avoid query issues
      const rawProductIds = bom.inputs.map((input) => input.raw_product_id);
      const rawProducts = await db.ProductMaster.findAll({
        where: {
          id: rawProductIds,
        },
      });

      const rawProductMap = {};
      rawProducts.forEach((product) => {
        rawProductMap[product.id] = product;
      });

      const purchaseRequests = [];

      // Process each raw material from BOM
      for (const input of bom.inputs) {
        const rawProductId = input.raw_product_id;
        const rawProduct = rawProductMap[rawProductId];

        if (!rawProduct) continue;

        // Calculate required quantity using BOM ratio
        let requiredRawQuantity = (input.quantity || 1) * requiredQuantity;

        // Try to enhance with yield standards if available
        let yieldInfo = null;
        try {
          console.log(
            `Checking yield standards for ${rawProduct.product_name} (species: ${rawProduct.species_master_id})`,
          );

          // Check if yield standards exist for this raw material's species and processing
          const yieldStandard = await db.YieldStandardMaster.findOne({
            where: {
              species_id: rawProduct.species_master_id,
              product_form: "FRESH",
              processing_type: "WHOLE", // Assume whole/raw material
              is_active: true,
            },
          });

          if (yieldStandard) {
            // If we have yield standards, we can be more precise about requirements
            const yieldPercentage =
              parseFloat(yieldStandard.expected_yield_pct) / 100;
            // Adjust quantity based on expected yield (inverse relationship)
            requiredRawQuantity = requiredRawQuantity / yieldPercentage;
            yieldInfo = {
              yieldPercentage: (yieldPercentage * 100).toFixed(2) + "%",
              standardId: yieldStandard.id,
            };
            console.log(
              `Applied yield adjustment for ${rawProduct.product_name}: ${yieldInfo.yieldPercentage} yield`,
            );
          } else {
            console.log(
              `No yield standard found for ${rawProduct.product_name}`,
            );
          }
        } catch (yieldError) {
          console.warn(
            `Could not apply yield standards for ${rawProduct.product_name}:`,
            yieldError.message,
          );
        }

        // Check current purchase inventory for this raw material
        const currentInventory = inventoryDetails.rawMaterials?.find(
          (rm) => rm.rawProductId === rawProductId,
        );

        const availableQuantity = currentInventory?.available || 0;
        const shortfall = Math.max(0, requiredRawQuantity - availableQuantity);

        if (shortfall > 0) {
          // Create procurement lot for this raw material
          // Check if orderId is a valid UUID, otherwise set to null
          const isValidUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              orderId,
            );

          const procurementLot = await db.ProcurementLots.create(
            {
              procurement_date: new Date(),
              order_id: isValidUUID ? orderId : null,
              unit_master_id: "cebe3155-f3d8-4a31-a36c-c1beeffbf0a1", // Default unit
              is_active: true,
            },
            {
              profile_id: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82", // BSE Admin user profile ID
            },
          );

          // Create procurement product
          const procurementProduct = await db.ProcurementProducts.create(
            {
              procurement_lot_id: procurementLot.id,
              product_master_id: rawProductId,
              procurement_quantity: shortfall,
              procurement_price: 0, // To be updated when supplier is selected
              procurement_purchaser: "SYSTEM_AUTO",
              procurement_product_type: "UNPROCESSED",
              order_id: isValidUUID ? orderId : null,
              supplier_master_id: "60d83d2d-4a8f-40da-b248-42e94bcf41a1", // Default supplier (JN)
              is_active: true,
            },
            {
              profile_id: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82", // BSE Admin user profile ID
            },
          );

          purchaseRequests.push({
            procurementLotId: procurementLot.id,
            procurementProductId: procurementProduct.id,
            rawProductId,
            productName: rawProduct.product_name,
            requiredQuantity: requiredRawQuantity,
            availableQuantity,
            shortfall,
            procurementLot: procurementLot.procurement_lot,
            yieldEnhanced: !!yieldInfo,
            yieldInfo,
          });

          console.log(
            `Created purchase request for ${rawProduct.product_name}: ${shortfall} units${yieldInfo ? ` (yield-enhanced: ${yieldInfo.yieldPercentage})` : " (BOM-based)"}`,
          );
        } else {
          console.log(
            `No purchase required for ${rawProduct.product_name} - sufficient inventory available`,
          );
        }
      }

      return {
        success: true,
        purchaseRequests,
        message: `Created ${purchaseRequests.length} purchase requests with yield-enhanced calculations`,
      };
    } catch (error) {
      console.error("Error creating purchase request:", error);
      throw new Error(`Purchase request creation failed: ${error.message}`);
    }
  }

  /**
   * Update procurement quantities with recommended order quantities from yield calculations
   * @param {string} orderId - Order ID to update procurement for
   * @param {Array} productUpdates - Array of { productId, recommendedQuantity } objects
   * @returns {Promise<Object>} Update results
   */
  async updateProcurementWithRecommendedQuantities(orderId, productUpdates) {
    try {
      console.log(`Updating procurement quantities for order ${orderId}`);

      const updateResults = [];
      let updatedCount = 0;

      for (const update of productUpdates) {
        const { productId, recommendedQuantity } = update;

        // Find existing procurement products for this order and product
        const existingProcurements = await db.ProcurementProducts.findAll({
          where: {
            order_id: orderId,
            product_master_id: productId,
            is_active: true,
          },
          include: [
            {
              model: db.ProcurementLots,
              as: "pl",
              where: { is_active: true },
            },
          ],
        });

        if (existingProcurements.length === 0) {
          console.log(
            `No existing procurement found for product ${productId} in order ${orderId}`,
          );
          updateResults.push({
            productId,
            status: "not_found",
            message: "No existing procurement found for this product",
          });
          continue;
        }

        // Update the first (most recent) procurement product
        const procurementToUpdate = existingProcurements[0];
        const oldQuantity = procurementToUpdate.procurement_quantity;

        await procurementToUpdate.update({
          procurement_quantity: recommendedQuantity,
          updated_at: new Date(),
        });

        updatedCount++;
        updateResults.push({
          productId,
          procurementProductId: procurementToUpdate.id,
          oldQuantity,
          newQuantity: recommendedQuantity,
          status: "updated",
          message: `Updated from ${oldQuantity} to ${recommendedQuantity}`,
        });

        console.log(
          `Updated procurement for product ${productId}: ${oldQuantity} → ${recommendedQuantity}`,
        );
      }

      return {
        success: true,
        orderId,
        totalUpdates: productUpdates.length,
        successfulUpdates: updatedCount,
        results: updateResults,
        message: `Successfully updated ${updatedCount} out of ${productUpdates.length} procurement quantities`,
      };
    } catch (error) {
      console.error("Error updating procurement quantities:", error);
      throw new Error(`Procurement quantity update failed: ${error.message}`);
    }
  }

  /**
   * Calculate and update procurement quantities for an order using yield-enhanced calculations
   * @param {string} orderId - Order ID to update procurement for
   * @returns {Promise<Object>} Update results with calculations
   */
  async calculateAndUpdateProcurementQuantities(orderId) {
    try {
      console.log(
        `Calculating and updating procurement quantities for order ${orderId}`,
      );

      // Get order details and products
      const order = await db.Orders.findOne({
        where: { id: orderId, is_active: true },
        include: [
          {
            model: db.OrderProducts,
            as: "orderProducts",
            where: { is_active: true },
            include: [
              {
                model: db.ProductMaster,
                as: "product",
                include: [
                  {
                    model: db.SpeciesMaster,
                    as: "SpeciesMaster",
                  },
                  {
                    model: db.DerivativeMaster,
                    as: "Derivative",
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!order || !order.orderProducts || order.orderProducts.length === 0) {
        throw new Error(`Order ${orderId} not found or has no products`);
      }

      const productUpdates = [];

      // Calculate recommended quantities for each order product
      for (const orderProduct of order.orderProducts) {
        const product = orderProduct.product;
        const quantityRequired = orderProduct.quantity;

        if (!product) continue;

        try {
          // Use RawMaterialCalculator to get recommended quantity
          const {
            RawMaterialCalculator,
          } = require("./raw_material_calculator");

          const calculationResult =
            await RawMaterialCalculator.calculateRawMaterialRequirements({
              productId: product.id,
              quantityRequired: parseFloat(quantityRequired),
              speciesId: product.species_master_id,
              processingType: "RAW",
            });

          if (
            calculationResult.success &&
            calculationResult.data.recommendedOrderQuantity
          ) {
            productUpdates.push({
              productId: product.id,
              recommendedQuantity:
                calculationResult.data.recommendedOrderQuantity,
              calculation: calculationResult.data,
            });

            console.log(
              `Calculated recommended quantity for ${product.product_name}: ${calculationResult.data.recommendedOrderQuantity}kg`,
            );
          } else {
            console.warn(
              `Could not calculate recommended quantity for product ${product.product_name}`,
            );
          }
        } catch (calcError) {
          console.warn(
            `Error calculating recommended quantity for product ${product.id}:`,
            calcError.message,
          );
        }
      }

      if (productUpdates.length === 0) {
        return {
          success: false,
          message: "No products could be calculated for quantity updates",
        };
      }

      // Update procurement quantities
      const updateResult =
        await this.updateProcurementWithRecommendedQuantities(
          orderId,
          productUpdates.map((update) => ({
            productId: update.productId,
            recommendedQuantity: update.recommendedQuantity,
          })),
        );

      return {
        success: true,
        orderId,
        calculations: productUpdates,
        updates: updateResult,
        message: `Calculated quantities for ${productUpdates.length} products and updated ${updateResult.successfulUpdates} procurements`,
      };
    } catch (error) {
      console.error(
        "Error calculating and updating procurement quantities:",
        error,
      );
      throw new Error(
        `Procurement quantity calculation and update failed: ${error.message}`,
      );
    }
  }

  /**
   * Get purchase requests for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Array>} Purchase requests for the order
   */
  async getPurchaseRequestsForOrder(orderId) {
    try {
      const purchaseRequests = await db.ProcurementProducts.findAll({
        where: {
          order_id: orderId,
          is_active: true,
        },
        include: [
          {
            model: db.ProcurementLots,
            as: "pl",
            where: { is_active: true },
          },
          {
            model: db.ProductMaster,
            as: "ProductMaster",
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return purchaseRequests.map((pr) => ({
        id: pr.id,
        procurementLotId: pr.procurement_lot_id,
        procurementLot: pr.pl?.procurement_lot,
        productId: pr.product_master_id,
        productName: pr.ProductMaster?.product_name,
        quantity: pr.quantity,
        status: pr.procurement_status,
        createdAt: pr.created_at,
      }));
    } catch (error) {
      console.error("Error getting purchase requests:", error);
      return [];
    }
  }
}

module.exports = new PurchaseRequestService();
