/**
 * Check Raw Material Stock Against Product Yield
 *
 * Validates if sufficient raw material stock is available based on
 * the product's yield percentage. If insufficient, recommends procurement.
 */

import models from "../../../../models";
import { Op } from "sequelize";

export const CheckStockForProduct = async (productData, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { product_master_id, quantity_required_kg } = productData;

      if (!product_master_id || !quantity_required_kg) {
        return resolve({
          success: false,
          message: "Product ID and quantity are required",
          canBeginProduct: false,
          suggestProcurement: true,
        });
      }

      // Get product details with yield information
      const product = await models.ProductMaster.findOne({
        where: { id: product_master_id, is_active: true },
        attributes: [
          "id",
          "product_name",
          "product_code",
          "derivative_master_id",
          "product_category_master_id",
        ],
        include: [
          {
            model: models.DerivativeMaster,
            attributes: ["id", "derivative_code", "derivative_name"],
            required: false,
          },
        ],
      });

      if (!product) {
        return resolve({
          success: false,
          message: "Product not found",
          canBeginProduct: false,
          suggestProcurement: true,
        });
      }

      // Get the yield percentage for this product
      // This would come from BOM or product specifications
      const yieldData = await models.BOM_Output?.findOne?.({
        where: { derivative_id: product.derivative_master_id },
        attributes: ["base_yield_percent"],
        raw: true,
      }).catch(() => null);

      const baseYieldPercent = yieldData?.base_yield_percent || 100; // Default to 100% if not found
      const yieldRatio = baseYieldPercent / 100;

      // Calculate required raw material quantity
      // Raw material required = Final Product Quantity / Yield Ratio
      const requiredRawMaterialKg = quantity_required_kg / yieldRatio;

      // Get available raw material stock for this product's species
      const rawMaterialProduct = await models.ProductMaster.findOne({
        where: {
          product_category_master_id: product.product_category_master_id,
          product_code: { [Op.iLike]: "RAW%" },
          is_active: true,
        },
        attributes: ["id", "product_name"],
      });

      if (!rawMaterialProduct) {
        return resolve({
          success: false,
          message: "No raw material product found for this species",
          canBeginProduct: false,
          suggestProcurement: true,
        });
      }

      // Calculate available stock from inventory
      // This queries actual inventory/packing records
      const inventoryQuery = `
        SELECT COALESCE(SUM(pi.quantity), 0) as available_qty
        FROM purchase_inventory pi
        INNER JOIN procurement_products pp ON pi.procurement_product_id = pp.id
        WHERE pp.product_master_id = :product_id 
        AND pi.is_active = true
      `;

      const [inventoryResult] = await models.sequelize.query(inventoryQuery, {
        replacements: { product_id: rawMaterialProduct.id },
        type: models.sequelize.QueryTypes.SELECT,
      });

      const availableStockKg = inventoryResult?.available_qty || 0;

      // Compare available stock vs required raw material
      const hassufficientStock = availableStockKg >= requiredRawMaterialKg;

      return resolve({
        success: true,
        product: {
          id: product.id,
          name: product.product_name,
          code: product.product_code,
        },
        orderQuantity: {
          required_kg: quantity_required_kg,
          unit: "KG",
        },
        rawMaterial: {
          baseYieldPercent,
          requiredKg: requiredRawMaterialKg.toFixed(2),
        },
        inventory: {
          rawMaterialProduct: rawMaterialProduct.product_name,
          availableStockKg: availableStockKg.toFixed(2),
        },
        stockCheckResult: {
          isSufficient: hassufficientStock,
          shortageKg: hassufficientStock
            ? 0
            : (requiredRawMaterialKg - availableStockKg).toFixed(2),
        },
        canBeginProduct: hassufficientStock,
        suggestProcurement: !hassufficientStock,
        message: hassufficientStock
          ? "Sufficient raw material stock available - Ready to begin production"
          : `Insufficient stock. Need ${requiredRawMaterialKg.toFixed(
              2
            )} kg but only ${availableStockKg.toFixed(
              2
            )} kg available. Shortage: ${(
              requiredRawMaterialKg - availableStockKg
            ).toFixed(2)} kg`,
      });
    } catch (err) {
      console.error("Error checking stock for product:", err);
      return resolve({
        success: false,
        message: "Error checking stock availability",
        error: err.message,
        canBeginProduct: false,
        suggestProcurement: true, // Default to procurement on error
      });
    }
  });
};

export default CheckStockForProduct;
