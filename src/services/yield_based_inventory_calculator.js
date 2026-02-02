"use strict";

const db = require("../../models");

/**
 * Utility class for calculating effective inventory considering yield standards
 */
class YieldBasedInventoryCalculator {
  /**
   * Calculate effective finished goods inventory from raw materials considering yield
   * @param {string} productId - Product master ID
   * @param {number} rawQuantity - Available raw material quantity
   * @returns {Promise<number>} Effective finished goods quantity
   */
  static async calculateEffectiveInventory(productId, rawQuantity) {
    try {
      // Get product details including derivative and species
      const productMaster = await db.ProductMaster.findByPk(productId, {
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

      if (!productMaster) {
        console.warn(`Product ${productId} not found for yield calculation`);
        return rawQuantity; // Return raw quantity as fallback
      }

      // For processed products, return the quantity as-is (no yield calculation needed)
      if (
        productMaster.is_raw === false ||
        productMaster.processing_state === "PROCESSED"
      ) {
        console.log(
          `Product ${productId} is processed - returning quantity unchanged: ${rawQuantity}`,
        );
        return rawQuantity;
      }

      // For raw materials, apply yield calculation
      const speciesId = productMaster.SpeciesMaster?.id;
      const derivativeId = productMaster.Derivative?.id;

      if (!speciesId || !derivativeId) {
        console.warn(
          `Missing species or derivative for raw product ${productId}`,
        );
        return rawQuantity; // Return raw quantity as fallback
      }

      // Get yield standard for this raw product
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

      // Calculate effective finished goods from raw materials
      const effectiveFinishedGoods = rawQuantity * yieldPercentage;

      console.log(
        `Yield calculation for raw product ${productId}: ${rawQuantity} raw → ${effectiveFinishedGoods} effective (at ${yieldPercentage * 100}% yield)`,
      );

      return effectiveFinishedGoods;
    } catch (error) {
      console.error("Error calculating effective inventory:", error);
      return rawQuantity; // Return raw quantity as fallback
    }
  }

  /**
   * Calculate required raw materials for finished goods production
   * @param {string} productId - Product master ID
   * @param {number} finishedQuantity - Required finished goods quantity
   * @returns {Promise<number>} Required raw material quantity
   */
  static async calculateRequiredRawMaterials(productId, finishedQuantity) {
    try {
      // Get product details including derivative and species
      const productMaster = await db.ProductMaster.findByPk(productId, {
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

      if (!productMaster) {
        console.warn(
          `Product ${productId} not found for raw material calculation`,
        );
        return finishedQuantity; // Return finished quantity as fallback
      }

      const speciesId = productMaster.SpeciesMaster?.id;
      const derivativeId = productMaster.Derivative?.id;

      if (!speciesId || !derivativeId) {
        console.warn(`Missing species or derivative for product ${productId}`);
        return finishedQuantity; // Return finished quantity as fallback
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

      // Calculate required raw materials: finished_goods / yield_percentage
      const requiredRawMaterials = finishedQuantity / yieldPercentage;

      console.log(
        `Raw material calculation for product ${productId}: ${finishedQuantity} finished → ${requiredRawMaterials} raw required (at ${yieldPercentage * 100}% yield)`,
      );

      return requiredRawMaterials;
    } catch (error) {
      console.error("Error calculating required raw materials:", error);
      return finishedQuantity; // Return finished quantity as fallback
    }
  }
}

module.exports = YieldBasedInventoryCalculator;
