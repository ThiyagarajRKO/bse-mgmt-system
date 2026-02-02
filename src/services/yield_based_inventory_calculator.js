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

      // Always apply yield calculation for inventory checking purposes
      // (we want to know how many finished goods can be produced from raw materials)

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

      // Special handling for count-based derivatives like cephalopod rings
      // For rings, the yield represents "rings per whole cephalopod" not percentage
      const isCephalopodRings =
        productMaster.SpeciesMaster?.parent_category_type === "Cephalopod" &&
        productMaster.Derivative?.derivative_code === "PRC_RINGS";

      let effectiveFinishedGoods;
      if (isCephalopodRings) {
        // For cephalopod rings: raw_quantity * rings_per_cephalopod
        // The yield percentage represents rings per whole cephalopod (e.g., 8.0 = 8 rings per cuttlefish)
        effectiveFinishedGoods = rawQuantity * yieldPercentage;
        console.log(
          `Cephalopod rings yield calculation for product ${productId}: ${rawQuantity} whole cephalopods → ${effectiveFinishedGoods} rings (at ${yieldPercentage} rings per cephalopod)`,
        );
      } else {
        // Standard weight-based yield calculation
        effectiveFinishedGoods = rawQuantity * yieldPercentage;
        console.log(
          `Standard yield calculation for raw product ${productId}: ${rawQuantity} raw → ${effectiveFinishedGoods} effective (at ${yieldPercentage * 100}% yield)`,
        );
      }

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

      // Special handling for count-based derivatives like cephalopod rings
      const isCephalopodRings =
        productMaster.SpeciesMaster?.parent_category_type === "Cephalopod" &&
        productMaster.Derivative?.derivative_code === "PRC_RINGS";

      let requiredRawMaterials;
      if (isCephalopodRings) {
        // For cephalopod rings: finished_rings / rings_per_cephalopod
        requiredRawMaterials = finishedQuantity / yieldPercentage;
        console.log(
          `Cephalopod rings raw material calculation for product ${productId}: ${finishedQuantity} rings → ${requiredRawMaterials} whole cephalopods required (at ${yieldPercentage} rings per cephalopod)`,
        );
      } else {
        // Standard calculation: finished_goods / yield_percentage
        requiredRawMaterials = finishedQuantity / yieldPercentage;
        console.log(
          `Standard raw material calculation for product ${productId}: ${finishedQuantity} finished → ${requiredRawMaterials} raw required (at ${yieldPercentage * 100}% yield)`,
        );
      }

      return requiredRawMaterials;
    } catch (error) {
      console.error("Error calculating required raw materials:", error);
      return finishedQuantity; // Return finished quantity as fallback
    }
  }
}

module.exports = YieldBasedInventoryCalculator;
