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
          "derivative_master_id",
          "product_category_master_id",
        ],
        include: [
          {
            model: models.DerivativeMaster,
            as: "Derivative",
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

      // Get the yield percentage for this product using BOM (Bill of Materials)
      // BOM Output contains the yield information for finished products
      const yieldData = await models.BomOutput?.findOne?.({
        where: { product_id: product.id },
        attributes: ["id", "base_yield_percent"],
        include: [
          {
            model: models.BomMaster,
            attributes: ["id"],
            required: true,
            include: [
              {
                model: models.BomInput,
                as: "inputs",
                attributes: ["raw_product_id", "quantity"],
                required: false,
              },
            ],
          },
        ],
        raw: false,
      }).catch((err) => {
        console.error("BomOutput query error:", err);
        return null;
      });

      // Calculate yield from BOM
      // Yield % = base_yield_percent from BOM Output
      let baseYieldPercent = 100; // Default if no BOM found
      if (yieldData?.BomMaster?.inputs?.length > 0) {
        // Use the base_yield_percent directly from BomOutput
        baseYieldPercent = yieldData.base_yield_percent || 100;
      }

      const yieldRatio = baseYieldPercent / 100;

      // Calculate required raw material quantity
      // Raw material required = Final Product Quantity * Yield Percent
      // (If 18% yield, then 1 KG finished needs 18% of input, not input/18%)
      const requiredRawMaterialKg = quantity_required_kg * yieldRatio;

      // Get raw material from BOM inputs for this product
      let rawMaterialProduct = null;
      if (yieldData?.BomMaster?.inputs?.length > 0) {
        const firstInput = yieldData.BomMaster.inputs[0];
        rawMaterialProduct = await models.ProductMaster.findOne({
          where: { id: firstInput.raw_product_id },
          attributes: ["id", "product_name"],
        });
      }

      if (!rawMaterialProduct) {
        // No BOM found - cannot determine raw material product
        // This product has no Bill of Materials configured
        return resolve({
          success: false,
          message:
            "No Bill of Materials (BOM) configured for this product. Cannot determine raw material requirements.",
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
              2,
            )} kg but only ${availableStockKg.toFixed(
              2,
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
