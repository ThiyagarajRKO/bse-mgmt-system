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
      const bomEntries = await db.BillOfMaterials.findAll({
        where: {
          product_master_id: productId,
          is_active: true,
        },
        include: [
          {
            model: db.ProcurementProducts,
            as: "ProcurementProduct",
            include: [
              {
                model: db.ProductMaster,
                as: "ProductMaster",
              },
            ],
          },
        ],
      });

      console.log(`BOM entries found: ${bomEntries?.length || 0}`);
      if (bomEntries) {
        console.log(`BOM entries: ${bomEntries.length}`);
      }

      if (!bomEntries || bomEntries.length === 0) {
        console.log(
          `No BOM found for product ${productId}, creating procurement for finished product as fallback`,
        );
        // Fallback: Create procurement for the finished product itself when no BOM is available
        return await this.createFallbackProcurement(
          productId,
          requiredQuantity,
          orderId,
          inventoryDetails,
        );
      }

      // Get raw product details separately to avoid query issues
      const rawProductIds = bomEntries
        .map((bomEntry) => bomEntry.ProcurementProduct?.product_master_id)
        .filter(Boolean);

      console.log(`Raw product IDs from BOM: ${rawProductIds.length}`);

      let rawProducts = [];
      if (rawProductIds.length > 0) {
        rawProducts = await db.ProductMaster.findAll({
          where: {
            id: rawProductIds,
          },
        });
        console.log(`Found ${rawProducts.length} raw products from BOM`);
      }

      // If no raw products found from BOM, try to find raw materials by species
      if (rawProducts.length === 0) {
        console.log(
          `No raw products found in BOM, searching by species for product ${productId}`,
        );

        // Get the finished product to find its species
        const finishedProduct = await db.ProductMaster.findByPk(productId, {
          include: [
            {
              model: db.SpeciesMaster,
              as: "SpeciesMaster",
            },
          ],
        });

        if (finishedProduct?.species_master_id) {
          rawProducts = await db.ProductMaster.findAll({
            where: {
              species_master_id: finishedProduct.species_master_id,
              is_active: true,
            },
            include: [
              {
                model: db.DerivativeMaster,
                as: "Derivative",
                where: {
                  processing_level: "Raw",
                },
                required: true,
              },
            ],
          });
          console.log(
            `Found ${rawProducts.length} raw products by species lookup`,
          );
        }
      }

      // If still no raw products found, fall back to finished product procurement
      if (rawProducts.length === 0) {
        console.log(
          `No raw materials found for product ${productId}, falling back to finished product procurement`,
        );
        return await this.createFallbackProcurement(
          productId,
          requiredQuantity,
          orderId,
          inventoryDetails,
        );
      }

      const rawProductMap = {};
      rawProducts.forEach((product) => {
        rawProductMap[product.id] = product;
      });

      const purchaseRequests = [];

      // Check if we have valid BOM entries with procurement products
      const hasValidBOMEntries = bomEntries.some(
        (bomEntry) =>
          bomEntry.ProcurementProduct?.product_master_id &&
          rawProductMap[bomEntry.ProcurementProduct.product_master_id],
      );

      if (hasValidBOMEntries) {
        console.log(`Processing raw materials from BOM entries`);
        // Process each raw material from BOM
        for (const bomEntry of bomEntries) {
          const procurementProduct = bomEntry.ProcurementProduct;
          const rawProduct = procurementProduct?.ProductMaster;
          const rawProductId = procurementProduct?.product_master_id;

          if (
            !rawProduct ||
            !procurementProduct ||
            !rawProductMap[rawProductId]
          ) {
            console.log(
              `Skipping BOM entry - missing procurement product or raw product data`,
            );
            continue;
          }

          // Calculate required quantity using BOM ratio (convert to integer)
          let requiredRawQuantity = Math.floor(
            (bomEntry.quantity_required || 1) * requiredQuantity,
          );

          // Process this raw material
          const result = await this.processRawMaterialProcurement(
            rawProduct,
            requiredRawQuantity,
            orderId,
            inventoryDetails,
            `BOM-based (${bomEntry.quantity_required || 1}:1 ratio)`,
          );

          if (result) {
            purchaseRequests.push(result);
          }
        }
      } else {
        console.log(`Processing raw materials found by species lookup`);
        // Process raw materials found by species (no BOM ratios available)
        for (const rawProduct of rawProducts) {
          // Use 1:1 ratio since we don't have BOM data (convert to integer)
          const requiredRawQuantity = Math.floor(requiredQuantity);

          const result = await this.processRawMaterialProcurement(
            rawProduct,
            requiredRawQuantity,
            orderId,
            inventoryDetails,
            `Species-based (estimated ratio)`,
          );

          if (result) {
            purchaseRequests.push(result);
          }
        }
      }

      return purchaseRequests;
    } catch (error) {
      console.error("Error creating purchase request:", error);
      throw new Error(`Purchase request creation failed: ${error.message}`);
    }
  }

  /**
   * Process procurement for a single raw material
   * @param {Object} rawProduct - The raw product master record
   * @param {number} requiredQuantity - Quantity needed
   * @param {string} orderId - Order ID
   * @param {Object} inventoryDetails - Current inventory details
   * @param {string} source - Source of the procurement requirement
   */
  async processRawMaterialProcurement(
    rawProduct,
    requiredQuantity,
    orderId,
    inventoryDetails,
    source,
  ) {
    try {
      console.log(
        `Processing raw material: ${rawProduct.product_name} (${rawProduct.product_id}), required: ${requiredQuantity}, source: ${source}`,
      );

      // Check current inventory for this raw product
      const currentStock = inventoryDetails[rawProduct.product_id] || 0;
      const shortage = Math.max(0, Math.floor(requiredQuantity - currentStock));

      if (shortage <= 0) {
        console.log(
          `Sufficient inventory for ${rawProduct.product_name}: ${currentStock} >= ${requiredQuantity}`,
        );
        return null; // No procurement needed
      }

      console.log(
        `Shortage detected for ${rawProduct.product_name}: need ${shortage} more units`,
      );

      // Create actual procurement records in database
      const transaction = await db.sequelize.transaction();

      try {
        // Get a system user (use first available user as system user for procurement records)
        let systemUserId = "87ffbaff-b7e9-4198-90d2-0fa12d85ef82"; // Default system user ID
        const systemUser = await db.UserProfiles.findOne({
          attributes: ["id"],
          raw: true,
        });
        if (systemUser) {
          systemUserId = systemUser.id;
        }

        // Get a default unit (first available unit master)
        const defaultUnit = await db.UnitMaster.findOne();
        if (!defaultUnit) {
          throw new Error("No unit master found in system");
        }

        // Get a default supplier (first available supplier master)
        const defaultSupplier = await db.SupplierMaster.findOne();
        if (!defaultSupplier) {
          throw new Error("No supplier master found in system");
        }

        // Generate a procurement lot identifier
        const procurementLotName = `AUTO-${Date.now()}-${orderId.substring(0, 8)}`;

        // Create procurement lot with profile_id in options for the beforeCreate hook
        const procurementLot = await db.ProcurementLots.create(
          {
            id: uuidv4(),
            order_id: orderId,
            procurement_date: new Date(), // Add current date
            procurement_lot: procurementLotName,
            unit_master_id: defaultUnit.id, // Use default unit
            is_active: true,
          },
          {
            transaction,
            profile_id: systemUserId, // Pass profile_id for the beforeCreate hook
          },
        );

        // Create procurement product record
        const procurementProduct = await db.ProcurementProducts.create(
          {
            id: uuidv4(),
            procurement_lot_id: procurementLot.id,
            product_master_id: rawProduct.id, // Use the UUID id, not product_id string
            supplier_master_id: defaultSupplier.id, // Use default supplier
            procurement_product_type: "UNPROCESSED",
            procurement_quantity: shortage,
            procurement_price: 0, // Will be set when purchased
            order_id: orderId,
            is_active: true,
            procurement_purchaser: "System", // Add required field
          },
          {
            transaction,
            profile_id: systemUserId, // Pass profile_id for the beforeCreate hook
          },
        );

        // Create or update purchase inventory record
        const existingInventory = await db.PurchaseInventory.findOne({
          where: {
            product_master_id: rawProduct.id,
            procurement_product_type: "UNPROCESSED",
            is_active: true,
          },
          transaction,
        });

        if (existingInventory) {
          // Update existing inventory
          await existingInventory.update(
            {
              quantity: (existingInventory.quantity || 0) + shortage,
              updated_at: new Date(),
              updated_by: systemUserId,
            },
            { transaction },
          );
          console.log(
            `Updated purchase inventory for ${rawProduct.product_name} to ${existingInventory.quantity + shortage}`,
          );
        } else {
          // Create new purchase inventory record
          await db.PurchaseInventory.create(
            {
              id: uuidv4(),
              product_master_id: rawProduct.id,
              procurement_product_id: procurementProduct.id,
              procurement_product_type: "UNPROCESSED",
              quantity: shortage,
              is_active: true,
              created_by: systemUserId,
            },
            { transaction },
          );
          console.log(
            `Created purchase inventory for ${rawProduct.product_name} with quantity ${shortage}`,
          );
        }

        await transaction.commit();

        console.log(
          `Created procurement record: ${procurementProduct.id} for ${shortage} units of ${rawProduct.product_name}`,
        );

        return {
          procurementLotId: procurementLot.id,
          procurementProductId: procurementProduct.id,
          productId: rawProduct.product_id,
          productName: rawProduct.product_name,
          requiredQuantity: shortage,
          currentStock,
          shortfall: shortage,
          procurementLot: procurementLot,
        };
      } catch (error) {
        await transaction.rollback();
        console.error(
          `Error creating procurement records for ${rawProduct.product_name}:`,
          error,
        );
        return null;
      }
    } catch (error) {
      console.error(
        `Error processing raw material ${rawProduct.product_name}:`,
        error,
      );
      return null;
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

  /**
   * Create fallback procurement for raw materials when no BOM is available
   * Instead of purchasing finished product, find raw materials for the species
   * @param {string} productId - Finished product ID
   * @param {number} requiredQuantity - Required quantity of finished product
   * @param {string} orderId - Order ID
   * @param {Object} inventoryDetails - Inventory details
   * @returns {Promise<Object>} Procurement result
   */
  async createFallbackProcurement(
    productId,
    requiredQuantity,
    orderId,
    inventoryDetails,
  ) {
    try {
      console.log(
        `Creating fallback procurement for raw materials needed to produce finished product ${productId}`,
      );

      // Get the finished product details
      const finishedProduct = await db.ProductMaster.findByPk(productId, {
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
      });

      if (!finishedProduct) {
        throw new Error(`Finished product ${productId} not found`);
      }

      console.log(
        `Finished product: ${finishedProduct.product_name} (Species: ${finishedProduct.SpeciesMaster?.species_name})`,
      );

      // Find raw materials for this species (products with processing_level = "Raw")
      const rawMaterials = await db.ProductMaster.findAll({
        where: {
          species_master_id: finishedProduct.species_master_id,
          is_active: true,
        },
        include: [
          {
            model: db.DerivativeMaster,
            as: "Derivative",
            where: {
              processing_level: "Raw",
            },
            required: true, // Only include products that have raw processing level
          },
        ],
      });

      console.log(`Found ${rawMaterials.length} raw materials for species`);

      if (rawMaterials.length === 0) {
        console.log(
          `No raw materials found for species ${finishedProduct.SpeciesMaster?.species_name}, falling back to finished product procurement`,
        );
        // Ultimate fallback: purchase the finished product itself
        return await this.createFinishedProductProcurement(
          productId,
          requiredQuantity,
          orderId,
          inventoryDetails,
        );
      }

      const purchaseRequests = [];

      // Process each raw material found
      for (const rawMaterial of rawMaterials) {
        // Use 1:1 ratio since we don't have BOM data
        const requiredRawQuantity = requiredQuantity;

        const result = await this.processRawMaterialProcurement(
          rawMaterial,
          requiredRawQuantity,
          orderId,
          inventoryDetails,
          `Species-based fallback (${rawMaterials.length} raw materials found)`,
        );

        if (result) {
          purchaseRequests.push(result);
        }
      }

      if (purchaseRequests.length === 0) {
        return {
          success: true,
          message: `No procurement needed - sufficient raw material inventory available`,
          procurementCreated: [],
        };
      }

      return {
        success: true,
        message: `Created ${purchaseRequests.length} raw material procurement requests needed to produce finished product`,
        procurementCreated: purchaseRequests,
      };
    } catch (error) {
      console.error("Error creating fallback procurement:", error);
      throw new Error(`Fallback procurement creation failed: ${error.message}`);
    }
  }

  /**
   * Create procurement for finished product as ultimate fallback
   * @param {string} productId - Finished product ID
   * @param {number} requiredQuantity - Required quantity
   * @param {string} orderId - Order ID
   * @param {Object} inventoryDetails - Inventory details
   * @returns {Promise<Object>} Procurement result
   */
  async createFinishedProductProcurement(
    productId,
    requiredQuantity,
    orderId,
    inventoryDetails,
  ) {
    try {
      console.log(
        `Creating finished product procurement as ultimate fallback for ${productId}`,
      );

      // Check current purchase inventory for this finished product
      const currentInventory = inventoryDetails.salesInventoryAvailable || 0;
      const shortfall = Math.max(0, requiredQuantity - currentInventory);

      if (shortfall <= 0) {
        return {
          success: true,
          message: "No procurement needed - sufficient inventory available",
          procurementCreated: [],
        };
      }

      // Create procurement lot for the finished product
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

      // Create procurement product for the finished product
      const procurementProductRecord = await db.ProcurementProducts.create(
        {
          procurement_lot_id: procurementLot.id,
          product_master_id: productId, // Finished product ID
          procurement_quantity: shortfall,
          procurement_price: 0, // To be updated when supplier is selected
          procurement_purchaser: "SYSTEM_AUTO",
          procurement_product_type: "FINISHED_GOOD", // Finished good procurement
          order_id: isValidUUID ? orderId : null,
          supplier_master_id: "60d83d2d-4a8f-40da-b248-42e94bcf41a1", // Default supplier
          is_active: true,
        },
        {
          profile_id: "87ffbaff-b7e9-4198-90d2-0fa12d85ef82", // BSE Admin user profile ID
        },
      );

      console.log(
        `Created fallback procurement for finished product: ${procurementProductRecord.id}`,
      );

      return {
        success: true,
        message: `Procurement created for finished product due to missing BOM/raw material data`,
        procurementCreated: [
          {
            procurementLotId: procurementLot.id,
            procurementProductId: procurementProductRecord.id,
            productId,
            productName: "Finished Product (BOM/raw materials not available)",
            requiredQuantity,
            availableQuantity: currentInventory,
            shortfall,
            procurementLot: procurementLot.procurement_lot,
          },
        ],
      };
    } catch (error) {
      console.error("Error creating finished product procurement:", error);
      throw new Error(
        `Finished product procurement creation failed: ${error.message}`,
      );
    }
  }
}

module.exports = new PurchaseRequestService();
