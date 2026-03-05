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
        processingType = "RAW",
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
        attributes: [
          "id",
          "product_name",
          "product_category_master_id",
          "derivative_master_id",
        ],
        raw: true,
      });

      if (!product) {
        // If not found, use default calculation
        console.warn(`Product not found: ${productId}, using defaults`);
        return this._calculateWithDefaultYield(
          quantityRequired,
          null,
          productForm,
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
        derivativeId: product.derivative_master_id,
        processingType,
      });

      // Step 3: Fetch yield standard for this species and derivative
      if (!effectiveSpeciesId || !product.derivative_master_id) {
        console.warn(
          "No species ID or derivative ID available, using defaults",
        );
        return this._calculateWithDefaultYield(
          quantityRequired,
          product,
          productForm,
        );
      }

      console.log(
        "[RAW MATERIALS] 🔍 Looking up yield standard with filters:",
        {
          species_id: effectiveSpeciesId,
          derivative_id: product.derivative_master_id,
          processing_type: processingType,
          product_form: productForm,
          is_active: true,
        },
      );

      // First try with all filters including product_form if available
      let yieldStandard = await models.YieldStandardMaster.findOne({
        where: {
          species_id: effectiveSpeciesId,
          derivative_id: product.derivative_master_id,
          processing_type: processingType,
          ...(productForm && { product_form: productForm }), // Include if provided
          is_active: true,
        },
        attributes: [
          "id",
          "species_id",
          "derivative_id",
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

      // If not found with product_form, try without it (backward compatibility)
      if (!yieldStandard && productForm) {
        console.log(
          "[RAW MATERIALS] ℹ️  Yield standard not found with product_form filter, trying without...",
        );
        yieldStandard = await models.YieldStandardMaster.findOne({
          where: {
            species_id: effectiveSpeciesId,
            derivative_id: product.derivative_master_id,
            processing_type: processingType,
            is_active: true,
          },
          attributes: [
            "id",
            "species_id",
            "derivative_id",
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
      }

      if (!yieldStandard) {
        console.warn(
          `[RAW MATERIALS] ⚠️  No yield standard found for species=${effectiveSpeciesId}, derivative=${product.derivative_master_id}, type=${processingType}`,
        );
        // Default conservative yield if not found
        return this._calculateWithDefaultYield(
          quantityRequired,
          product,
          productForm,
        );
      }

      console.log(
        `[RAW MATERIALS] 📊 Yield standard found for species: ${yieldStandard.expected_yield_pct || 60}%`,
      );

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
        product.product_category_master_id,
      );

      // Step 6: Get current inventory levels for this raw material
      const inventoryLevels =
        await this._getInventoryLevels(effectiveSpeciesId);

      // Step 7: Compile intelligent calculation results
      const inventoryGap = Math.max(
        0,
        rawMaterialNeeded + bufferQuantity - inventoryLevels.totalAvailable,
      );

      const calculations = {
        finishedProductRequired: quantityRequired,
        yieldPercentage: (yieldPercentage * 100).toFixed(2) + "%",
        variancePercentage: (variancePercentage * 100).toFixed(2) + "%",
        conversionRatio: (1 / yieldPercentage).toFixed(2) + ":1",
        rawMaterialNeeded: rawMaterialNeeded,
        safetyBuffer: bufferQuantity,
        totalWithBuffer: rawMaterialNeeded + bufferQuantity,
        currentInventory: inventoryLevels.totalAvailable,
        inventoryGap: inventoryGap,
        recommendedOrderQuantity: inventoryGap > 0 ? inventoryGap : 0,
        totalRequiredQuantity: rawMaterialNeeded + bufferQuantity, // Add total required regardless of inventory
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
        inventoryLevels,
      );

      // ✅ NEW: Get actual raw materials list for this product
      // This list can be used to populate a "select raw material" dropdown
      const rawMaterialsList = await this.getRawMaterialsForProduct({
        productId,
        quantityRequired,
        speciesId: effectiveSpeciesId,
      });

      console.log("Raw Material Calculation Complete:", {
        finishedProductRequired: quantityRequired,
        rawMaterialNeeded,
        bufferQuantity,
        totalWithBuffer: rawMaterialNeeded + bufferQuantity,
        currentInventory: inventoryLevels.totalAvailable,
        recommendedOrderQuantity: Math.max(
          rawMaterialNeeded + bufferQuantity - inventoryLevels.totalAvailable,
          0,
        ),
        rawMaterialsCount: rawMaterialsList.length,
      });

      return {
        success: true,
        data: {
          ...calculations,
          aiAnalysis: aiAnalysis,
          timestamp: new Date().toISOString(),
          // ✅ NEW FIELD: Raw materials list with product names for dropdown selection
          raw_materials: rawMaterialsList,
          raw_materials_count: rawMaterialsList.length,
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
          params.productForm,
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
      const processingTypes = ["RAW", "COOKED"];

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
              // Get the actual raw materials for this product
              const rawMaterials = await this.getRawMaterialsForProduct({
                productId,
                quantityRequired,
                speciesId,
              });

              recommendations.push({
                productForm: form,
                processingType: type,
                ...result.data,
                rawMaterials: rawMaterials,
              });
            }
          } catch (error) {
            // Skip failed combinations
            console.warn(
              `Skipping ${form}-${type} combination: ${error.message}`,
            );
          }
        }
      }

      // Sort by recommended order quantity (ascending)
      recommendations.sort(
        (a, b) => a.recommendedOrderQuantity - b.recommendedOrderQuantity,
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
        "Consider reducing variance threshold through better process control",
      );
    }

    if (inventory.totalAvailable > calculations.rawMaterialNeeded * 2) {
      analysis.optimizationTips.push(
        "High inventory on hand - consider consolidation opportunities",
      );
    }

    if (similarProducts && similarProducts.length > 0) {
      const avgYield =
        similarProducts.reduce((sum, p) => sum + p.yield, 0) /
        similarProducts.length;
      if (avgYield > parseFloat(calculations.yieldPercentage) * 1.05) {
        analysis.optimizationTips.push(
          "Similar products show higher yield - review processing standards",
        );
      }
    }

    analysis.optimizationTips.push(
      "Always verify with quality check before production",
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
      // First, get all product categories for this species
      const categories = await models.ProductCategoryMaster.findAll({
        where: { species_master_id: speciesId, is_active: true },
        attributes: ["id"],
        raw: true,
      });

      const categoryIds = categories.map((cat) => cat.id);

      if (categoryIds.length === 0) {
        console.warn(`No categories found for species ${speciesId}`);
        return {
          totalAvailable: 0,
          recordCount: 0,
          details: [],
        };
      }

      // Get all products in these categories
      const products = await models.ProductMaster.findAll({
        where: {
          product_category_master_id: { [Op.in]: categoryIds },
          is_active: true,
        },
        attributes: ["id"],
        raw: true,
      });

      const productIds = products.map((prod) => prod.id);

      if (productIds.length === 0) {
        console.warn(
          `No products found for categories of species ${speciesId}`,
        );
        return {
          totalAvailable: 0,
          recordCount: 0,
          details: [],
        };
      }

      // Get procurement products for these product masters
      const procurementProducts = await models.ProcurementProducts.findAll({
        where: {
          product_master_id: { [Op.in]: productIds },
          is_active: true,
          procurement_product_type: "UNPROCESSED", // Only raw materials
        },
        attributes: ["id"],
        raw: true,
      });

      const procurementProductIds = procurementProducts.map((pp) => pp.id);

      if (procurementProductIds.length === 0) {
        console.warn(
          `No procurement products found for products of species ${speciesId}`,
        );
        return {
          totalAvailable: 0,
          recordCount: 0,
          details: [],
        };
      }

      // Finally, get the inventory for these procurement products
      const inventory = await models.PurchaseInventory.findAll({
        where: {
          procurement_product_id: { [Op.in]: procurementProductIds },
          is_active: true,
        },
        attributes: ["id", "quantity", "procurement_product_id"],
        raw: true,
        limit: 100,
      });

      const totalAvailable = inventory.reduce(
        (sum, inv) => sum + parseFloat(inv.quantity || 0),
        0,
      );

      console.log(
        `Inventory levels for species ${speciesId}: ${totalAvailable} total from ${inventory.length} records`,
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
      totalRequiredQuantity: rawMaterialNeeded + bufferQuantity,
      processingType: "RAW",
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

  /**
   * Get raw materials for a finished product based on BOM
   * @param {Object} params - { productId, quantityRequired, speciesId }
   * @returns {Array} - Array of raw materials with calculated requirements
   */
  static async getRawMaterialsForProduct(params) {
    try {
      const { productId, quantityRequired, speciesId } = params;

      console.log("[RAW MATERIALS] 🔍 Starting getRawMaterialsForProduct:", {
        productId,
        quantityRequired,
        speciesId,
      });

      // Step 1: Fetch the finished product to get its species - IMPORTANT for filtering
      let effectiveSpeciesId = speciesId;
      let orderedProduct = null;

      if (!effectiveSpeciesId) {
        // Try multiple approaches to get species from product
        orderedProduct = await models.ProductMaster.findOne({
          where: { id: productId, is_active: true },
          attributes: [
            "id",
            "product_name",
            "species_master_id",
            "product_category_master_id",
          ],
          raw: false,
        });

        // Approach 1: Direct species_master_id (if available)
        if (orderedProduct?.species_master_id) {
          effectiveSpeciesId = orderedProduct.species_master_id;
          console.log(
            "[RAW MATERIALS] ✅ Found species from product.species_master_id:",
            effectiveSpeciesId,
          );
        }
        // Approach 2: Through product category
        else if (orderedProduct?.product_category_master_id) {
          const category = await models.ProductCategoryMaster.findOne({
            where: { id: orderedProduct.product_category_master_id },
            attributes: ["species_master_id"],
            raw: true,
          });
          if (category?.species_master_id) {
            effectiveSpeciesId = category.species_master_id;
            console.log(
              "[RAW MATERIALS] ✅ Found species from product category:",
              effectiveSpeciesId,
            );
          }
        }

        if (!effectiveSpeciesId) {
          console.warn(
            "[RAW MATERIALS] ⚠️  Could not determine species for product:",
            productId,
          );
        }
      }

      if (!orderedProduct) {
        orderedProduct = await models.ProductMaster.findOne({
          where: { id: productId, is_active: true },
          attributes: ["id", "product_name"],
          raw: true,
        });
      }

      console.log(
        "[RAW MATERIALS] 📋 Querying BOM entries for product:",
        productId,
      );
      console.log(
        "[RAW MATERIALS] 🔗 Expected species ID:",
        effectiveSpeciesId,
      );

      // Get BOM entries for this finished product - STRICT BOM FILTERING
      const simpleBomEntries = await models.BillOfMaterials.findAll({
        where: { product_master_id: productId, is_active: true },
        attributes: [
          "id",
          "product_master_id",
          "procurement_product_id",
          "quantity_required",
          "unit_of_measure",
        ],
        raw: true,
      });

      console.log(
        `[RAW MATERIALS] 📦 Found ${simpleBomEntries.length} basic BOM entries for product ${productId}`,
        simpleBomEntries.map((b) => ({
          id: b.id,
          procurement_product_id: b.procurement_product_id,
          quantity_required: b.quantity_required,
        })),
      );

      if (!simpleBomEntries || simpleBomEntries.length === 0) {
        console.warn(
          `[RAW MATERIALS] ⚠️  No BOM entries found for product ${productId}. This product has no defined bill of materials.`,
        );
        console.warn(
          `[RAW MATERIALS] User should configure BOM entries in the system before ordering this product.`,
        );
        return [];
      }

      if (!effectiveSpeciesId) {
        console.error(
          "[RAW MATERIALS] ❌ CRITICAL: Cannot filter raw materials - species ID is unknown!",
        );
        console.error(
          "[RAW MATERIALS] Product lookup failed or has no species. Check ProductMaster configuration.",
        );
        console.error(
          "[RAW MATERIALS] Will return empty list to prevent cross-species contamination",
        );
        return [];
      }

      console.log(
        `[RAW MATERIALS] ✅ Using species filter: ${effectiveSpeciesId} for BOM-based filtering`,
      );

      // Now enrich each BOM entry with procurement product and product master data
      const bomEntries = [];
      let orphanedCount = 0;

      for (const simpleBom of simpleBomEntries) {
        try {
          console.log(
            `[RAW MATERIALS] 🔗 Processing BOM entry ${simpleBom.id}: procurement_product_id=${simpleBom.procurement_product_id}`,
          );

          // First try without include to see if it exists at all
          // NOTE: paranoid: false is needed because ProcurementProducts uses soft deletes
          const procProductBasic = await models.ProcurementProducts.findOne({
            where: { id: simpleBom.procurement_product_id, is_active: true },
            paranoid: false, // Include soft-deleted records
            raw: true,
          });

          if (!procProductBasic) {
            console.warn(
              `[RAW MATERIALS] ❌ ORPHANED BOM: Procurement product ${simpleBom.procurement_product_id} not found (marked as ORPHANED)`,
            );
            orphanedCount++;
            continue;
          }

          console.log(
            `[RAW MATERIALS] ✅ Found basic procurement product ${simpleBom.procurement_product_id}, fetching full details...`,
          );

          // Now try with include
          const procProduct = await models.ProcurementProducts.findOne({
            where: { id: simpleBom.procurement_product_id, is_active: true },
            attributes: ["id", "product_master_id", "procurement_product_type"],
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
                required: false,
                attributes: [
                  "id",
                  "product_name",
                  "product_category_master_id",
                ],
              },
            ],
            paranoid: false, // Include soft-deleted records
            raw: false,
          });

          if (procProduct && procProduct.ProductMaster) {
            console.log(
              `[RAW MATERIALS] ✅ BOM entry is VALID: ${simpleBom.id} → ProcurementProduct(${procProduct.id}) → ProductMaster(${procProduct.ProductMaster?.id})`,
            );
            bomEntries.push({
              ...simpleBom,
              ProcurementProduct: procProduct,
            });
          } else if (procProduct && !procProduct.ProductMaster) {
            console.warn(
              `[RAW MATERIALS] ⚠️  BROKEN REFERENCE: Procurement product exists but ProductMaster missing: ${simpleBom.procurement_product_id}`,
            );
            orphanedCount++;
          } else {
            console.warn(
              `[RAW MATERIALS] ❌ MISSING: BOM entry ${simpleBom.id} references non-existent procurement product ${simpleBom.procurement_product_id}`,
            );
            orphanedCount++;
          }
        } catch (err) {
          console.error(
            `[RAW MATERIALS] 💥 Error fetching procurement product ${simpleBom.procurement_product_id}:`,
            err.message,
          );
          orphanedCount++;
        }
      }

      console.log(
        `[RAW MATERIALS] 📊 BOM Enrichment Summary: ${bomEntries.length} valid, ${orphanedCount} orphaned/broken out of ${simpleBomEntries.length} total`,
      );

      if (bomEntries.length === 0) {
        console.error(
          `[RAW MATERIALS] ❌ CRITICAL: All BOM entries for product ${productId} are orphaned or broken!`,
        );
        console.error(
          `[RAW MATERIALS] This means the BOM references procurement products that don't exist.`,
        );
        console.error(
          `[RAW MATERIALS] Action: Regenerate BOM or create the missing procurement products.`,
        );
        return [];
      }
      console.log(
        `[RAW MATERIALS] ✅ Proceeding with ${bomEntries.length} valid BOM entries, filtering by species: ${effectiveSpeciesId}`,
      );

      const rawMaterials = [];
      let skippedCount = 0;

      for (const bomEntry of bomEntries) {
        console.log(
          `[RAW MATERIALS] 🔄 Processing BOM entry ${bomEntry.id}: qty_required=${bomEntry.quantity_required}`,
        );

        const procurementProduct = bomEntry.ProcurementProduct;
        if (!procurementProduct) {
          console.warn(
            `[RAW MATERIALS] ❌ No procurement product for BOM entry ${bomEntry.id}`,
          );
          skippedCount++;
          continue;
        }

        const productMaster = procurementProduct.ProductMaster;
        if (!productMaster) {
          console.warn(
            `[RAW MATERIALS] ❌ No product master for procurement product ${procurementProduct.id}`,
          );
          skippedCount++;
          continue;
        }

        console.log(
          `[RAW MATERIALS] 🎯 Raw material found: ${productMaster.product_name} (ID: ${productMaster.id})`,
        );

        // Fetch full product details with species to check for species match
        let rawMaterialProduct = await models.ProductMaster.findOne({
          where: { id: productMaster.id, is_active: true },
          attributes: [
            "id",
            "product_name",
            "species_master_id",
            "product_category_master_id",
          ],
          raw: false,
        });

        if (!rawMaterialProduct) {
          console.warn(
            `[RAW MATERIALS] ❌ Raw material product not found: ${productMaster.id}`,
          );
          skippedCount++;
          continue;
        }

        // STRICT SPECIES FILTERING: Only include raw materials from the SAME species
        // Get the species ID from the raw material product
        let rawMaterialSpeciesId = rawMaterialProduct.species_master_id;

        // If raw material doesn't have direct species_master_id, try product category
        if (
          !rawMaterialSpeciesId &&
          rawMaterialProduct.product_category_master_id
        ) {
          const rawCategory = await models.ProductCategoryMaster.findOne({
            where: { id: rawMaterialProduct.product_category_master_id },
            attributes: ["species_master_id"],
            raw: true,
          });
          rawMaterialSpeciesId = rawCategory?.species_master_id;
        }

        // FILTER: Only keep if species matches
        if (effectiveSpeciesId && rawMaterialSpeciesId) {
          if (rawMaterialSpeciesId !== effectiveSpeciesId) {
            console.log(
              `[RAW MATERIALS] ❌ SPECIES MISMATCH: "${rawMaterialProduct.product_name}" is species ${rawMaterialSpeciesId}, but ordered product is species ${effectiveSpeciesId}`,
            );
            skippedCount++;
            continue;
          }
          console.log(
            `[RAW MATERIALS] ✅ SPECIES MATCH: "${rawMaterialProduct.product_name}" is correct species ${effectiveSpeciesId}`,
          );
        } else if (!rawMaterialSpeciesId) {
          console.warn(
            `[RAW MATERIALS] ⚠️  Cannot determine species for raw material ${productMaster.id}, SKIPPING`,
          );
          skippedCount++;
          continue;
        }

        // Calculate required quantity based on BOM ratio
        const bomQuantity = parseFloat(bomEntry.quantity_required) || 1;
        const requiredQuantity = Math.ceil(quantityRequired * bomQuantity);

        console.log(
          `[RAW MATERIALS] 📐 Quantity calculation: ${quantityRequired} ordered × ${bomQuantity} (BOM ratio) = ${requiredQuantity} required (rounded)`,
        );

        // Get ALL procurement inventory records for this product_master_id
        // Filter to only active, non-default/seeded records when possible
        // Get records ordered by creation date (newest first) to prioritize actual orders
        const allInventoryRecords = await models.PurchaseInventory.findAll({
          where: {
            product_master_id: productMaster.id,
            is_active: true,
          },
          attributes: [
            "id",
            "quantity",
            "available_stock",
            "reserved_quantity",
            "procurement_product_id",
            "created_at",
          ],
          order: [["created_at", "DESC"]], // Most recent first
          raw: true,
        });

        console.log(
          `[RAW MATERIALS] 📦 Found ${allInventoryRecords.length} inventory records for ${productMaster.product_name}`,
        );

        // Sum all quantities to get total warehouse stock
        // Use available_stock if initialized, fall back to quantity
        // available_stock = quantity - reserved_quantity
        const totalStock = allInventoryRecords.reduce((sum, inv) => {
          // If available_stock is set and greater than 0, use it
          // Otherwise, initialize it as total quantity
          const availStock = inv.available_stock || 0;
          const qty = availStock > 0 ? availStock : inv.quantity || 0;
          return sum + qty;
        }, 0);
        const currentStock = Math.ceil(totalStock);

        console.log(
          `[RAW MATERIALS] 📊 Warehouse stock for ${productMaster.product_name}: ${currentStock} (required: ${requiredQuantity})`,
        );

        // Calculate inventory gap based on warehouse stock
        const inventoryGap = Math.ceil(
          Math.max(0, requiredQuantity - currentStock),
        );

        // Only include items that need ordering (inventory gap > 0)
        if (inventoryGap > 0) {
          rawMaterials.push({
            procurement_product_id: procurementProduct.id,
            procurement_product_type:
              procurementProduct.procurement_product_type || "UNPROCESSED",
            product_master_id: productMaster.id,
            product_name: productMaster.product_name,
            bom_quantity_required: bomQuantity,
            total_quantity_required: requiredQuantity,
            current_stock: currentStock,
            inventory_gap: inventoryGap,
            recommended_order_quantity: Math.ceil(inventoryGap),
            unit_of_measure: bomEntry.unit_of_measure || "KG",
          });

          console.log(
            `[RAW MATERIALS] ✅ INCLUDED: "${productMaster.product_name}" (Gap: ${inventoryGap})`,
          );
        } else {
          console.log(
            `[RAW MATERIALS] ✅ SUFFICIENT: "${productMaster.product_name}" (Stock: ${currentStock}, Required: ${requiredQuantity}, Gap: 0)`,
          );
        }
      }

      console.log(
        `[RAW MATERIALS] ✅ Final result: ${rawMaterials.length} valid raw materials from BOM, ${skippedCount} skipped`,
      );
      console.log(
        `[RAW MATERIALS] Raw materials list:`,
        rawMaterials.map((m) => ({
          product_name: m.product_name,
          required: m.total_quantity_required,
          stock: m.current_stock,
          gap: m.inventory_gap,
        })),
      );
      return rawMaterials;
    } catch (error) {
      console.error(
        "[RAW MATERIALS] Error getting raw materials for product:",
        error,
      );
      return [];
    }
  }

  /**
   * Get ALL raw materials for a product INCLUDING those with sufficient stock
   * Returns items with inventory_gap set (can be 0 for sufficient items)
   * Used by UI to display complete inventory status
   */
  static async getRawMaterialsForProductWithStatus(params) {
    try {
      const { productId, quantityRequired, speciesId } = params;

      console.log(
        "[RAW MATERIALS WITH STATUS] Getting all raw materials (including sufficient stock):",
        {
          productId,
          quantityRequired,
          speciesId,
        },
      );

      // Get product details
      const product = await models.ProductMaster.findOne({
        where: { id: productId, is_active: true },
        attributes: ["id", "product_name", "species_master_id"],
        raw: true,
      });

      if (!product) {
        console.warn(
          "[RAW MATERIALS WITH STATUS] Product not found:",
          productId,
        );
        return [];
      }

      const effectiveSpeciesId = product.species_master_id || speciesId;

      if (
        effectiveSpeciesId &&
        product.species_master_id !== effectiveSpeciesId
      ) {
        console.log(
          "[RAW MATERIALS WITH STATUS] Using provided speciesId override:",
          speciesId,
        );
      }

      // Get BOM entries
      const simpleBomEntries = await models.BillOfMaterials.findAll({
        where: { product_master_id: productId, is_active: true },
        attributes: [
          "id",
          "product_master_id",
          "procurement_product_id",
          "quantity_required",
          "unit_of_measure",
        ],
        raw: true,
      });

      console.log(
        `[RAW MATERIALS WITH STATUS] Found ${simpleBomEntries.length} BOM entries`,
      );

      if (!simpleBomEntries || simpleBomEntries.length === 0) {
        console.warn(
          `[RAW MATERIALS WITH STATUS] No BOM entries for product ${productId}`,
        );
        return [];
      }

      const rawMaterials = [];

      for (const bomEntry of simpleBomEntries) {
        try {
          const procProduct = await models.ProcurementProducts.findOne({
            where: { id: bomEntry.procurement_product_id, is_active: true },
            attributes: ["id", "product_master_id", "procurement_product_type"],
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
                attributes: ["id", "product_name", "species_master_id"],
              },
            ],
            raw: false,
          });

          if (!procProduct || !procProduct.ProductMaster) {
            console.warn(
              `[RAW MATERIALS WITH STATUS] No procurement product or master: ${bomEntry.procurement_product_id}`,
            );
            continue;
          }

          const productMaster = procProduct.ProductMaster;
          const bomQuantity = parseFloat(bomEntry.quantity_required) || 1;
          // quantityRequired refers to finished goods needed for the order
          // first compute finished goods requirement based on BOM quantity
          const finishedQty = Math.ceil(quantityRequired * bomQuantity);

          // determine raw material requirement using *effective* yield
          // base calculator returns finished goods from raw; we need the inverse.
          const YieldBasedInventoryCalculator = require("./yield_based_inventory_calculator");
          let rawQtyRequired = finishedQty; // fallback
          try {
            // start estimate using base yield
            const baseRequirement = Math.ceil(
              await YieldBasedInventoryCalculator.calculateRequiredRawMaterials(
                productId,
                finishedQty,
              ),
            );
            // now adjust using effective yield by iterating near estimate
            let candidate = baseRequirement;
            let effective =
              await YieldBasedInventoryCalculator.calculateEffectiveInventory(
                productId,
                candidate,
              );
            // if effective is too low, increment until we reach finishedQty
            const maxIter = 20;
            let iter = 0;
            while (effective < finishedQty && iter < maxIter) {
              candidate += Math.ceil((finishedQty - effective) / 0.5); // coarse step
              effective =
                await YieldBasedInventoryCalculator.calculateEffectiveInventory(
                  productId,
                  candidate,
                );
              iter++;
            }
            rawQtyRequired = candidate;
          } catch (err) {
            console.warn(
              "[RAW MATERIALS WITH STATUS] Effective yield calc failed, using base requirement:",
              err.message,
            );
            // fall back to base requirement calculation
            try {
              rawQtyRequired = Math.ceil(
                await YieldBasedInventoryCalculator.calculateRequiredRawMaterials(
                  productId,
                  finishedQty,
                ),
              );
            } catch {}
          }

          // Get ALL inventory records (don't filter by gap)
          const allInventoryRecords = await models.PurchaseInventory.findAll({
            where: { product_master_id: productMaster.id },
            attributes: ["quantity", "available_stock", "reserved_quantity"],
            raw: true,
          });

          // use total quantity (raw material stock) rather than only available_stock
          const totalStock = allInventoryRecords.reduce((sum, inv) => {
            return sum + (parseFloat(inv.quantity) || 0);
          }, 0);

          const currentStock = Math.ceil(totalStock);
          const inventoryGap = Math.ceil(
            Math.max(0, rawQtyRequired - currentStock),
          );

          // IMPORTANT: Include this item REGARDLESS of gap (gap can be 0)
          // compute effective yield used to derive raw requirement
          const effectiveYieldPct =
            finishedQty > 0 ? (finishedQty / rawQtyRequired) * 100 : 0;

          rawMaterials.push({
            procurement_product_id: procProduct.id,
            procurement_product_type:
              procProduct.procurement_product_type || "UNPROCESSED",
            product_master_id: productMaster.id,
            product_name: productMaster.product_name,
            bom_quantity_required: bomQuantity,
            // report the raw material quantity that needs to be purchased
            total_quantity_required: rawQtyRequired,
            // also keep the finished goods requirement for reference
            finished_quantity_required: finishedQty,
            effective_yield_percent: +effectiveYieldPct.toFixed(2),
            current_stock: currentStock,
            inventory_gap: inventoryGap,
            recommended_order_quantity:
              inventoryGap > 0 ? Math.ceil(inventoryGap) : 0,
            unit_of_measure: bomEntry.unit_of_measure || "KG",
          });

          console.log(
            `[RAW MATERIALS WITH STATUS] ✅ Added: ${productMaster.product_name} (Gap: ${inventoryGap})`,
          );
        } catch (err) {
          console.error(
            `[RAW MATERIALS WITH STATUS] Error processing BOM entry:`,
            err.message,
          );
        }
      }

      console.log(
        `[RAW MATERIALS WITH STATUS] Returning ${rawMaterials.length} materials (including sufficient stock items)`,
      );

      return rawMaterials;
    } catch (error) {
      console.error(
        "[RAW MATERIALS WITH STATUS] Error getting raw materials:",
        error,
      );
      return [];
    }
  }

  /**
   * Get multi-category raw material recommendations
   * Returns arrays of raw materials grouped by category/type
   */
  static async getMultiCategoryRecommendations(params) {
    try {
      const { productId, quantityRequired, speciesId } = params;

      console.log("[MULTI-CATEGORY] Getting recommendations for product:", {
        productId,
        quantityRequired,
        speciesId,
      });

      // Get ALL raw materials INCLUDING sufficient stock items
      const rawMaterials = await this.getRawMaterialsForProductWithStatus({
        productId,
        quantityRequired,
        speciesId,
      });

      console.log(
        `[MULTI-CATEGORY] Retrieved ${rawMaterials.length} raw materials`,
      );

      // If no BOM entries found, return empty array
      if (!rawMaterials || rawMaterials.length === 0) {
        console.warn(
          "[MULTI-CATEGORY] No raw materials found for product:",
          productId,
        );
        return {
          data: [],
          success: false,
          message:
            "No BOM entries or raw materials configured for this product",
        };
      }

      // Group raw materials by type or category
      const grouped = {};
      rawMaterials.forEach((material) => {
        const category = material.procurement_product_type || "UNPROCESSED";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(material);
      });

      // Convert to array format with category info
      const result = Object.entries(grouped).map(([category, materials]) => ({
        category,
        categoryName: category === "UNPROCESSED" ? "Raw Materials" : category,
        rawMaterials: materials,
        totalMaterials: materials.length,
        totalInventoryGap: materials.reduce(
          (sum, m) => sum + m.inventory_gap,
          0,
        ),
      }));

      console.log("[MULTI-CATEGORY] Grouped into", result.length, "categories");

      return {
        data: result,
        success: true,
        rawMaterialsCount: rawMaterials.length,
      };
    } catch (error) {
      console.error("[MULTI-CATEGORY] Error:", error);
      throw error;
    }
  }
}

export default RawMaterialCalculator;
