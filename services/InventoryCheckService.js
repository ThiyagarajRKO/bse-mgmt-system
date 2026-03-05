"use strict";

const db = require("../models");

class InventoryCheckService {
  /**
   * Check inventory availability for an order product and determine the appropriate action
   * @param {string} orderProductId - Order product ID
   * @param {string} productId - Product master ID
   * @param {number} requiredQuantity - Required quantity
   * @returns {Promise<Object>} Inventory check result with action type and available quantities
   */
  async checkInventoryForOrderProduct(
    orderProductId,
    productId,
    requiredQuantity,
  ) {
    try {
      console.log(
        `Checking inventory for product ${productId}, required quantity: ${requiredQuantity}`,
      );

      // First, check sales inventory for the finished product
      const salesInventoryResult = await this.checkSalesInventory(
        productId,
        requiredQuantity,
      );

      // debug info for sales inventory
      console.log(
        `InventoryCheckService: sales inventory result for ${productId}:`,
        salesInventoryResult,
      );

      if (salesInventoryResult.available >= requiredQuantity) {
        // Product is fully available in sales inventory
        console.log(
          `InventoryCheckService: finished product available, allocating from sales inventory`,
        );
        return {
          action: "DISPATCH",
          allocationStatus: "ALLOCATED",
          salesInventoryAvailable: salesInventoryResult.available,
          purchaseInventoryAvailable: 0,
          rawMaterialsAvailable: 0,
          shortfall: 0,
          details: `Product fully available in sales inventory (${salesInventoryResult.available} units)`,
        };
      }

      // Partial availability in sales inventory, check raw materials for remaining quantity
      const remainingQuantity =
        requiredQuantity - salesInventoryResult.available;
      const rawMaterialsResult = await this.checkRawMaterialsAvailability(
        productId,
        remainingQuantity,
      );

      console.log(
        `InventoryCheckService: raw materials result for ${productId}:`,
        rawMaterialsResult,
      );

      // consider physical availability as well, so that yield rounding
      // doesn't incorrectly flag a shortage when raw stock is plenty
      const effectiveAvailableForDecision = Math.max(
        rawMaterialsResult.available || 0,
        rawMaterialsResult.physicalAvailable || 0,
      );
      console.log(
        `InventoryCheckService: effective available (max of yield/physical) =`,
        effectiveAvailableForDecision,
      );
      if (effectiveAvailableForDecision >= remainingQuantity) {
        // Raw materials are available for production
        console.log(
          `InventoryCheckService: raw materials sufficient for remaining quantity; marking ALLOCATED`,
        );
        return {
          action: "BEGIN_PRODUCTION",
          allocationStatus: "ALLOCATED",
          salesInventoryAvailable: salesInventoryResult.available,
          purchaseInventoryAvailable: rawMaterialsResult.available,
          rawMaterialsAvailable: rawMaterialsResult.available,
          shortfall: 0,
          details: `Partial sales inventory (${salesInventoryResult.available}), raw materials available for remaining ${remainingQuantity}`,
        };
      }

      // Neither product nor raw materials fully available
      console.log(
        `InventoryCheckService: insufficient inventory, returning PENDING_PURCHASE`,
      );
      return {
        action: "RAISE_PURCHASE_REQUEST",
        allocationStatus: "PENDING_PURCHASE",
        salesInventoryAvailable: salesInventoryResult.available,
        purchaseInventoryAvailable: rawMaterialsResult.available,
        rawMaterialsAvailable: rawMaterialsResult.available,
        shortfall: remainingQuantity - rawMaterialsResult.available,
        details: `Insufficient inventory: sales=${salesInventoryResult.available}, raw materials=${rawMaterialsResult.available}, shortfall=${remainingQuantity - rawMaterialsResult.available}`,
      };
    } catch (error) {
      console.error("Error checking inventory:", error);
      throw new Error(`Inventory check failed: ${error.message}`);
    }
  }

  /**
   * Check available quantity in sales inventory for a product
   * @param {string} productId - Product master ID
   * @param {number} requiredQuantity - Required quantity
   * @returns {Promise<Object>} Available quantity in sales inventory
   */
  async checkSalesInventory(productId, requiredQuantity) {
    try {
      // Get total available quantity in sales inventory for this product
      const salesInventory = await db.SalesInventory.findAll({
        where: {
          product_master_id: productId,
          is_active: true,
        },
        attributes: [
          [
            db.sequelize.fn("SUM", db.sequelize.col("available_quantity")),
            "total_available",
          ],
        ],
        raw: true,
      });

      const available = salesInventory[0]?.total_available || 0;
      console.log(
        `Sales inventory for product ${productId}: ${available} units available`,
      );

      return {
        available: parseFloat(available) || 0,
      };
    } catch (error) {
      console.error("Error checking sales inventory:", error);
      return { available: 0 };
    }
  }

  /**
   * Check raw materials availability in purchase inventory
   * @param {string} productId - Finished product ID
   * @param {number} requiredQuantity - Required quantity of finished product
   * @returns {Promise<Object>} Raw materials availability
   */
  async checkRawMaterialsAvailability(productId, requiredQuantity) {
    try {
      // Get product details including derivative and species
      const productMaster = await db.ProductMaster.findByPk(productId, {
        include: [
          {
            model: db.SpeciesMaster,
            // association defined without a custom alias, so use the default
            // which in Sequelize is the model name (SpeciesMaster)
            as: "SpeciesMaster",
          },
          {
            model: db.DerivativeMaster,
            // alias matches what's specified in product_master.js
            as: "Derivative",
          },
        ],
      });

      if (!productMaster) {
        console.log(`Product ${productId} not found`);
        return { available: 0, rawMaterials: [] };
      }

      const speciesId = productMaster.SpeciesMaster?.id;
      const derivativeId = productMaster.Derivative?.id;

      // NOTE: there used to be a stray export here which caused the module to
      // re‑export itself from inside the method.  It didn't break things but
      // made the source harder to reason about, so remove it.

      if (!speciesId) {
        console.log(`No species found for product ${productId}`);
        return { available: 0, rawMaterials: [] };
      }

      if (!derivativeId) {
        console.log(`No derivative found for product ${productId}`);
        return { available: 0, rawMaterials: [] };
      }

      // Get yield standard for this product
      const yieldStandard = await db.YieldStandardMaster.findOne({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          processing_type: "RAW", // Default to RAW processing type
          is_active: true,
        },
        attributes: ["expected_yield_pct"],
      });

      const yieldPercentage = yieldStandard?.expected_yield_pct
        ? parseFloat(yieldStandard.expected_yield_pct) / 100
        : 0.6; // Default conservative yield of 60%

      console.log(
        `Using yield percentage: ${yieldPercentage * 100}% for product ${productId}`,
      );

      // Find BOM for this product
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

      if (!bomEntries || bomEntries.length === 0) {
        // No BOM configured – treat the product itself as a raw material.
        // In this case inventory availability should simply reflect the
        // physical purchase stock without applying any yield.
        console.log(
          `No BOM found for product ${productId}, using raw stock fallback`,
        );
        const purchaseInventory = await db.PurchaseInventory.findAll({
          where: {
            product_master_id: productId,
            is_active: true,
          },
          // NOTE: we switched from available_quantity to available_stock in
          // the database.  all inventory checks must use the new column
          // otherwise they will see zero and return PENDING_PURCHASE.
          attributes: [
            [
              db.sequelize.fn("SUM", db.sequelize.col("available_stock")),
              "total_available",
            ],
          ],
          raw: true,
        });
        const availableRaw = parseFloat(
          purchaseInventory[0]?.total_available || 0,
        );
        return {
          available: availableRaw,
          rawMaterials: [],
          yieldPercentage: yieldPercentage,
        };
      }

      let totalAvailable = Infinity; // Start with infinity, will be limited by scarcest material
      const rawMaterialsStatus = [];
      let totalAvailablePhysical = Infinity; // physical finished goods without yield

      // Check each raw material in the BOM
      for (const bomEntry of bomEntries) {
        const procurementProduct = bomEntry.ProcurementProduct;
        const rawProduct = procurementProduct?.ProductMaster;
        const rawProductId = procurementProduct?.product_master_id;

        if (!rawProduct || !procurementProduct) continue;

        // Validate BOM quantity is positive
        const bomQuantity = parseFloat(bomEntry.quantity_required) || 1;
        if (bomQuantity <= 0) {
          console.warn(
            `Invalid BOM quantity ${bomQuantity} for product ${rawProductId}, using 1.0`,
          );
          bomEntry.quantity_required = 1;
        }

        const requiredRawQuantity =
          bomEntry.quantity_required * requiredQuantity;

        // Check purchase inventory for this raw material
        const purchaseInventory = await db.PurchaseInventory.findAll({
          where: {
            product_master_id: rawProductId,
            is_active: true,
          },
          attributes: [
            [
              db.sequelize.fn("SUM", db.sequelize.col("available_stock")),
              "total_available",
            ],
          ],
          raw: true,
        });

        const availableRawQuantity = parseFloat(
          purchaseInventory[0]?.total_available || 0,
        );

        // Calculate how much finished product can be produced from available raw materials
        // considering yield loss
        const bomQuantityDivisor = parseFloat(bomEntry.quantity_required) || 1;
        const potentialFinishedGoods =
          bomQuantityDivisor > 0
            ? availableRawQuantity / bomQuantityDivisor
            : 0;
        // round rather than floor to avoid rounding-down causing false
        // shortages when inventory is effectively sufficient.  flooring was
        // overly conservative in earlier versions and led to orders staying
        // "pending" even though the raw material covered the requirement.
        const effectiveFinishedGoods = Math.round(
          potentialFinishedGoods * yieldPercentage,
        );

        rawMaterialsStatus.push({
          rawProductId,
          productName: rawProduct.product_name,
          required: requiredRawQuantity,
          available: availableRawQuantity,
          yieldPercentage: yieldPercentage,
          canProduce: effectiveFinishedGoods,
        });

        // Update total available based on this material's constraint
        totalAvailable = Math.min(totalAvailable, effectiveFinishedGoods);
        // compute physical finished-goods equivalent (ignore yield)
        const physicalFinishedGoods =
          bomQuantityDivisor > 0
            ? Math.floor(availableRawQuantity / bomQuantityDivisor)
            : 0;

        // keep track of the scarcest physical capacity as well, so callers can
        // show a yield-unadjusted availability if desired
        totalAvailablePhysical = Math.min(
          totalAvailablePhysical,
          physicalFinishedGoods,
        );
      }

      console.log(
        `Raw materials check for product ${productId}: can produce ${totalAvailable} units (with ${yieldPercentage * 100}% yield)`,
      );

      return {
        // yield-adjusted availability
        available: totalAvailable,
        // physical availability without yield loss
        physicalAvailable:
          totalAvailablePhysical === Infinity ? 0 : totalAvailablePhysical,
        rawMaterials: rawMaterialsStatus,
        yieldPercentage: yieldPercentage,
      };
    } catch (error) {
      console.error("Error checking raw materials:", error);
      return { available: 0, rawMaterials: [] };
    }
  }

  /**
   * Reduce quantity from sales inventory
   * @param {string} productId - Product master ID
   * @param {number} quantity - Quantity to reduce
   * @param {string} orderId - Order ID for reference
   * @returns {Promise<boolean>} Success status
   */
  async reduceSalesInventory(productId, quantity, orderId) {
    try {
      console.log(
        `Reducing ${quantity} units from sales inventory for product ${productId}`,
      );

      // Get sales inventory records ordered by FIFO (oldest first)
      const salesInventoryRecords = await db.SalesInventory.findAll({
        where: {
          product_master_id: productId,
          available_quantity: { [db.Sequelize.Op.gt]: 0 },
          is_active: true,
        },
        order: [["created_at", "ASC"]],
      });

      let remainingToReduce = quantity;

      for (const record of salesInventoryRecords) {
        if (remainingToReduce <= 0) break;

        const reduceAmount = Math.min(
          remainingToReduce,
          record.available_quantity,
        );

        await record.update({
          available_quantity: record.available_quantity - reduceAmount,
          updated_at: new Date(),
        });

        // Create inventory transaction record
        await this.createInventoryTransaction({
          inventory_id: record.id,
          inventory_type: "SALES",
          transaction_type: "REDUCTION",
          quantity: reduceAmount,
          reference_id: orderId,
          reference_type: "ORDER_CONFIRMATION",
        });

        remainingToReduce -= reduceAmount;
      }

      if (remainingToReduce > 0) {
        throw new Error(
          `Insufficient sales inventory: could not reduce ${quantity} units`,
        );
      }

      return true;
    } catch (error) {
      console.error("Error reducing sales inventory:", error);
      throw error;
    }
  }

  /**
   * Reduce raw materials from purchase inventory
   * @param {string} productId - Finished product ID
   * @param {number} quantity - Quantity of finished product to produce
   * @param {string} orderId - Order ID for reference
   * @returns {Promise<boolean>} Success status
   */
  async reduceRawMaterials(productId, quantity, orderId) {
    try {
      console.log(
        `Reducing raw materials for ${quantity} units of product ${productId}`,
      );

      // Get BOM for this product
      const productMaster = await db.ProductMaster.findByPk(productId, {
        include: [
          {
            model: db.ProductCategoryMaster,
            as: "ProductCategoryMaster",
            include: [
              {
                model: db.SpeciesMaster,
                as: "SpeciesMaster",
              },
            ],
          },
        ],
      });

      if (!productMaster) {
        throw new Error(`Product ${productId} not found`);
      }

      const speciesId = productMaster.ProductCategoryMaster?.SpeciesMaster?.id;
      if (!speciesId) {
        throw new Error(`Species not found for product ${productId}`);
      }

      const bom = await db.BomMaster.findOne({
        where: {
          species_id: speciesId,
          is_active: true,
        },
        include: [
          {
            model: db.BomInput,
            as: "inputs",
          },
        ],
      });

      if (!bom || !bom.inputs) {
        throw new Error(`No BOM found for product ${productId}`);
      }

      // Reduce each raw material
      for (const input of bom.inputs) {
        const rawProductId = input.raw_product_id;
        const requiredQuantity = (input.quantity || 1) * quantity;

        await this.reducePurchaseInventory(
          rawProductId,
          requiredQuantity,
          orderId,
        );
      }

      return true;
    } catch (error) {
      console.error("Error reducing raw materials:", error);
      throw error;
    }
  }

  /**
   * Reduce quantity from purchase inventory
   * @param {string} productId - Product master ID
   * @param {number} quantity - Quantity to reduce
   * @param {string} orderId - Order ID for reference
   * @returns {Promise<boolean>} Success status
   */
  async reducePurchaseInventory(productId, quantity, orderId) {
    try {
      console.log(
        `Reducing ${quantity} units from purchase inventory for product ${productId}`,
      );

      // Get purchase inventory records ordered by FIFO
      const purchaseInventoryRecords = await db.PurchaseInventory.findAll({
        where: {
          product_master_id: productId,
          available_quantity: { [db.Sequelize.Op.gt]: 0 },
          is_active: true,
        },
        order: [["created_at", "ASC"]],
      });

      let remainingToReduce = quantity;

      for (const record of purchaseInventoryRecords) {
        if (remainingToReduce <= 0) break;

        const reduceAmount = Math.min(
          remainingToReduce,
          record.available_quantity,
        );

        await record.update({
          available_quantity: record.available_quantity - reduceAmount,
          updated_at: new Date(),
        });

        // Create inventory transaction record
        await this.createInventoryTransaction({
          inventory_id: record.id,
          inventory_type: "PURCHASE",
          transaction_type: "REDUCTION",
          quantity: reduceAmount,
          reference_id: orderId,
          reference_type: "ORDER_CONFIRMATION",
        });

        remainingToReduce -= reduceAmount;
      }

      if (remainingToReduce > 0) {
        throw new Error(
          `Insufficient purchase inventory: could not reduce ${quantity} units`,
        );
      }

      return true;
    } catch (error) {
      console.error("Error reducing purchase inventory:", error);
      throw error;
    }
  }

  /**
   * Create inventory transaction record
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async createInventoryTransaction(transactionData) {
    try {
      // Check if inventory_transaction model exists
      if (!db.InventoryTransaction) {
        console.log(
          "InventoryTransaction model not found, skipping transaction logging",
        );
        return null;
      }

      return await db.InventoryTransaction.create({
        ...transactionData,
        created_at: new Date(),
        is_active: true,
      });
    } catch (error) {
      console.error("Error creating inventory transaction:", error);
      // Don't throw error for transaction logging failures
      return null;
    }
  }
}

module.exports = new InventoryCheckService();
