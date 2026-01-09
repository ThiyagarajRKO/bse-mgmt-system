/**
 * Raw Material Calculator Service
 * Uses AI logic to determine how many raw materials are needed based on:
 * 1. Product category and finished product requirements
 * 2. Yield standards (conversion ratios)
 * 3. Processing type and product form
 * 4. Current inventory levels
 */

import models from "../../models";
import { Op } from "sequelize";

export class RawMaterialCalculator {
  /**
   * Calculate raw material requirements based on finished product needs
   * @param {Object} params - { productId, quantityRequired, speciesId, productCategoryId }
   * @returns {Object} - { rawMaterialNeeded, yieldPercentage, conversionRatio, calculations }
   */
  static async calculateRawMaterialRequirements(params) {
    try {
      const {
        productId,
        quantityRequired,
        speciesId,
        productCategoryId,
        productForm = "FRESH",
        processingType = "WHOLE",
      } = params;

      console.log("Starting Raw Material Calculation:", {
        productId,
        quantityRequired,
        speciesId,
        productForm,
        processingType,
      });

      // Step 1: Fetch product details (simplified query)
      let product = await models.ProductMaster.findOne({
        where: { id: productId, is_active: true },
        attributes: ["id", "product_name", "product_category_master_id"],
        raw: true,
      });

      if (!product) {
        // If not found, use default calculation
        console.warn(`Product not found: ${productId}, using defaults`);
        return this._calculateWithDefaultYield(
          quantityRequired,
          null,
          productForm
        );
      }

      // Step 2: Determine species and product category
      let effectiveSpeciesId = speciesId;

      if (!effectiveSpeciesId && product?.product_category_master_id) {
        // Try to fetch species from product category
        const category = await models.ProductCategoryMaster.findOne({
          where: { id: product.product_category_master_id },
          attributes: ["species_master_id"],
          raw: true,
        });
        effectiveSpeciesId = category?.species_master_id;
      }

      console.log("Product Info:", {
        productName: product.product_name,
        effectiveSpeciesId,
        productForm,
        processingType,
      });

      // Step 3: Fetch yield standard for this species and product form
      if (!effectiveSpeciesId) {
        console.warn("No species ID available, using defaults");
        return this._calculateWithDefaultYield(
          quantityRequired,
          product,
          productForm
        );
      }

      const yieldStandard = await models.YieldStandardMaster.findOne({
        where: {
          species_id: effectiveSpeciesId,
          product_form: productForm,
          processing_type: processingType,
          is_active: true,
        },
        attributes: [
          "id",
          "species_id",
          "product_form",
          "processing_type",
          "expected_yield_pct",
          "allowed_variance_pct",
          "min_yield_threshold",
          "max_yield_threshold",
          "is_active",
          "created_by",
          "updated_by",
        ],
        raw: true,
      });

      if (!yieldStandard) {
        console.warn(
          `No yield standard found for species=${effectiveSpeciesId}, form=${productForm}, type=${processingType}`
        );
        // Default conservative yield if not found
        return this._calculateWithDefaultYield(
          quantityRequired,
          product,
          productForm
        );
      }

      // Step 4: Calculate raw material needed based on yield percentage
      const yieldPercentage =
        parseFloat(yieldStandard.expected_yield_pct) / 100;
      const variancePercentage =
        parseFloat(yieldStandard.allowed_variance_pct) / 100;

      // Raw Material Needed = Finished Product Qty / Yield %
      const rawMaterialNeeded = Math.ceil(quantityRequired / yieldPercentage);

      // Add buffer for variance
      const bufferQuantity = Math.ceil(rawMaterialNeeded * variancePercentage);

      // Step 5: Fetch similar products from same category to learn patterns
      const similarProducts = await this._fetchCategoryProductPatterns(
        product.product_category_master_id
      );

      // Step 6: Get current inventory levels for this raw material
      const inventoryLevels = await this._getInventoryLevels(
        effectiveSpeciesId
      );

      // Step 7: Compile intelligent calculation results
      const calculations = {
        finishedProductRequired: quantityRequired,
        yieldPercentage: (yieldPercentage * 100).toFixed(2) + "%",
        variancePercentage: (variancePercentage * 100).toFixed(2) + "%",
        conversionRatio: (1 / yieldPercentage).toFixed(2) + ":1",
        rawMaterialNeeded: rawMaterialNeeded,
        safetyBuffer: bufferQuantity,
        totalWithBuffer: rawMaterialNeeded + bufferQuantity,
        currentInventory: inventoryLevels.totalAvailable,
        inventoryGap: Math.max(
          0,
          rawMaterialNeeded + bufferQuantity - inventoryLevels.totalAvailable
        ),
        recommendedOrderQuantity: Math.max(
          rawMaterialNeeded + bufferQuantity - inventoryLevels.totalAvailable,
          0
        ),
        processingType: processingType,
        productForm: productForm,
        productCategory: product?.ProductCategoryMaster?.product_category,
        species: product?.ProductCategoryMaster?.SpeciesMaster?.species_name,
        yieldStandardId: yieldStandard.id,
      };

      // Step 8: AI Analysis
      const aiAnalysis = this._performAIAnalysis(
        calculations,
        similarProducts,
        inventoryLevels
      );

      console.log("Raw Material Calculation Complete:", calculations);

      return {
        success: true,
        data: {
          ...calculations,
          aiAnalysis: aiAnalysis,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error in calculateRawMaterialRequirements:", error);
      return {
        success: false,
        error: error.message,
        data: this._calculateWithDefaultYield(
          params.quantityRequired,
          null,
          params.productForm
        ),
      };
    }
  }

  /**
   * Get multiple product category variations and their requirements
   * @param {Object} params - { productId, quantityRequired, speciesId }
   * @returns {Array} - Array of recommendations for different product forms
   */
  static async getMultiCategoryRecommendations(params) {
    try {
      const { productId, quantityRequired, speciesId } = params;

      const productForms = ["FRESH", "FROZEN", "COOKED", "RTE"];
      const processingTypes = ["WHOLE", "CLEANED", "FILLETED", "PROCESSED"];

      const recommendations = [];

      for (const form of productForms) {
        for (const type of processingTypes) {
          try {
            const result = await this.calculateRawMaterialRequirements({
              productId,
              quantityRequired,
              speciesId,
              productForm: form,
              processingType: type,
            });

            if (result.success && result.data) {
              recommendations.push({
                productForm: form,
                processingType: type,
                ...result.data,
              });
            }
          } catch (error) {
            // Skip failed combinations
            console.warn(
              `Skipping ${form}-${type} combination: ${error.message}`
            );
          }
        }
      }

      // Sort by recommended order quantity (ascending)
      recommendations.sort(
        (a, b) => a.recommendedOrderQuantity - b.recommendedOrderQuantity
      );

      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      console.error("Error in getMultiCategoryRecommendations:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * AI Analysis: Determine intelligent recommendations based on patterns
   */
  static _performAIAnalysis(calculations, similarProducts, inventory) {
    const analysis = {
      recommendation: "",
      confidence: 0,
      riskLevel: "LOW",
      optimizationTips: [],
      urgency: "NORMAL",
    };

    const orderQty = calculations.recommendedOrderQuantity;
    const safety = calculations.safetyBuffer;
    const variance = parseFloat(calculations.variancePercentage);

    // Determine recommendation strength
    if (orderQty <= 0) {
      analysis.recommendation =
        "✓ SUFFICIENT INVENTORY: No additional purchase needed";
      analysis.confidence = 95;
    } else if (orderQty <= calculations.rawMaterialNeeded * 0.1) {
      analysis.recommendation =
        "● MINIMAL ORDER: Small quantity top-up recommended";
      analysis.confidence = 85;
      analysis.urgency = "LOW";
    } else if (orderQty <= calculations.rawMaterialNeeded * 0.5) {
      analysis.recommendation =
        "⚠ MODERATE ORDER: Significant quantity needed within 3 days";
      analysis.confidence = 80;
      analysis.urgency = "MEDIUM";
      analysis.riskLevel = "MEDIUM";
    } else {
      analysis.recommendation =
        "🔴 URGENT ORDER: Large quantity needed ASAP (within 24hrs)";
      analysis.confidence = 75;
      analysis.urgency = "HIGH";
      analysis.riskLevel = "HIGH";
    }

    // Optimization tips based on patterns
    if (variance > 5) {
      analysis.optimizationTips.push(
        "Consider reducing variance threshold through better process control"
      );
    }

    if (inventory.totalAvailable > calculations.rawMaterialNeeded * 2) {
      analysis.optimizationTips.push(
        "High inventory on hand - consider consolidation opportunities"
      );
    }

    if (similarProducts && similarProducts.length > 0) {
      const avgYield =
        similarProducts.reduce((sum, p) => sum + p.yield, 0) /
        similarProducts.length;
      if (avgYield > parseFloat(calculations.yieldPercentage) * 1.05) {
        analysis.optimizationTips.push(
          "Similar products show higher yield - review processing standards"
        );
      }
    }

    analysis.optimizationTips.push(
      "Always verify with quality check before production"
    );

    return analysis;
  }

  /**
   * Fetch similar products from the same category to analyze patterns
   */
  static async _fetchCategoryProductPatterns(categoryId) {
    try {
      const products = await models.ProductMaster.findAll({
        where: {
          product_category_master_id: categoryId,
          is_active: true,
        },
        attributes: ["id", "product_name"],
        limit: 5,
        raw: true,
      });

      return products || [];
    } catch (error) {
      console.warn("Could not fetch category patterns:", error.message);
      return [];
    }
  }

  /**
   * Get current inventory levels for a species
   */
  static async _getInventoryLevels(speciesId) {
    try {
      const inventory = await models.PurchaseInventory.findAll({
        where: {
          is_active: true,
        },
        include: [
          {
            model: models.ProcurementProducts,
            attributes: ["id", "product_master_id"],
            include: [
              {
                model: models.ProductMaster,
                attributes: ["product_category_master_id"],
                include: [
                  {
                    model: models.ProductCategoryMaster,
                    attributes: ["species_master_id"],
                    where: { species_master_id: speciesId },
                  },
                ],
              },
            ],
          },
        ],
        raw: true,
        limit: 100,
      });

      const totalAvailable = inventory.reduce(
        (sum, inv) => sum + parseFloat(inv.quantity || 0),
        0
      );

      return {
        totalAvailable: totalAvailable,
        recordCount: inventory.length,
        details: inventory,
      };
    } catch (error) {
      console.warn("Could not fetch inventory levels:", error.message);
      return {
        totalAvailable: 0,
        recordCount: 0,
        details: [],
      };
    }
  }

  /**
   * Calculate with default yield (conservative 60%)
   */
  static _calculateWithDefaultYield(quantityRequired, product, productForm) {
    const defaultYield = 0.6; // 60% conservative default
    const defaultVariance = 0.05; // 5% variance buffer

    const rawMaterialNeeded = Math.ceil(quantityRequired / defaultYield);
    const bufferQuantity = Math.ceil(rawMaterialNeeded * defaultVariance);

    const calculations = {
      finishedProductRequired: quantityRequired,
      yieldPercentage: "60.00%",
      variancePercentage: "5.00%",
      conversionRatio: "1.67:1",
      rawMaterialNeeded: rawMaterialNeeded,
      safetyBuffer: bufferQuantity,
      totalWithBuffer: rawMaterialNeeded + bufferQuantity,
      currentInventory: 0,
      inventoryGap: rawMaterialNeeded + bufferQuantity,
      recommendedOrderQuantity: rawMaterialNeeded + bufferQuantity,
      processingType: "UNKNOWN",
      productForm: productForm || "FRESH",
      productCategory:
        product?.ProductCategoryMaster?.product_category || "N/A",
      species:
        product?.ProductCategoryMaster?.SpeciesMaster?.species_name || "N/A",
      note: "Using conservative default yield (60%) - no yield standard found",
      isDefault: true,
    };

    // Add basic AI analysis even for default calculations
    const aiAnalysis = this._performAIAnalysis(calculations, [], {
      totalAvailable: 0,
    });

    return {
      ...calculations,
      aiAnalysis: aiAnalysis,
    };
  }
}

export default RawMaterialCalculator;
