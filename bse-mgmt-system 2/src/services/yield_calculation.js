import models from "../../models";
import TaxResolutionService from "./tax_resolution.js";
import { RawMaterialCalculator } from "./raw_material_calculator.js";

const {
  YieldStandardMaster,
  YieldActual,
  YieldReasonMaster,
  PackingList,
  Order,
  OrderProduct,
} = models;

/**
 * Yield Calculation Service
 * Handles yield tracking, variance calculations, margin impact analysis,
 * and procurement predictions based on yield standards
 */
export class YieldCalculationService {
  /**
   * Capture yield after packing list finalization
   * @param {Object} params - { packing_list_id, profile_id }
   * @returns {Object} - Yield capture result
   */
  static async captureYield({ packing_list_id, profile_id }) {
    try {
      // Get packing list with order details
      const packingList = await PackingList.findOne({
        where: {
          id: packing_list_id,
          status: "LOCKED",
          is_active: true,
        },
        include: [
          {
            model: Order,
            as: "salesOrder",
            include: [
              {
                model: OrderProduct,
                as: "orderProducts",
                where: { is_active: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!packingList) {
        throw new Error("Packing list not found or not in LOCKED status");
      }

      // For each order product, calculate yield
      const yieldResults = [];

      for (const orderProduct of packingList.salesOrder.orderProducts) {
        // Get product to determine derivative
        const product = await models.ProductMaster.findOne({
          where: { id: orderProduct.product_master_id, is_active: true },
          attributes: ["derivative_master_id"],
          raw: true,
        });

        if (!product || !product.derivative_master_id) {
          console.warn(
            `Product ${orderProduct.product_master_id} not found or has no derivative`,
          );
          continue;
        }

        // Get yield standards for this product
        const yieldStandard = await this.getYieldStandard({
          species_id: orderProduct.species_id,
          derivative_id: product.derivative_master_id,
          processing_type: this.determineProcessingType(orderProduct),
        });

        if (!yieldStandard) {
          console.warn(
            `No yield standard found for species ${orderProduct.species_id}, derivative ${product.derivative_master_id}`,
          );
          continue;
        }

        // Calculate actual yield from procurement data
        // This would typically come from procurement lot tracking
        const actualYieldData = await this.calculateActualYield({
          order_product: orderProduct,
          packing_list: packingList,
          yield_standard: yieldStandard,
        });

        // Create yield actual record
        const yieldActual = await YieldActual.create({
          batch_id: packingList.sales_order_id, // Using order ID as batch ID for now
          packing_list_id,
          species_id: orderProduct.species_id,
          product_form: yieldStandard.product_form,
          processing_type: yieldStandard.processing_type,
          raw_input_kg: actualYieldData.raw_input_kg,
          raw_cost_per_kg: actualYieldData.raw_cost_per_kg,
          saleable_output_kg: actualYieldData.saleable_output_kg,
          actual_yield_pct: actualYieldData.actual_yield_pct,
          expected_yield_pct: yieldStandard.expected_yield_pct,
          variance_pct: actualYieldData.variance_pct,
          loss_kg: actualYieldData.loss_kg,
          loss_value: actualYieldData.loss_value,
          status: actualYieldData.status,
          reason_codes: actualYieldData.reason_codes,
          created_by: profile_id,
          updated_by: profile_id,
        });

        yieldResults.push({
          yield_actual_id: yieldActual.id,
          species_name: orderProduct.product_name,
          actual_yield_pct: actualYieldData.actual_yield_pct,
          expected_yield_pct: yieldStandard.expected_yield_pct,
          variance_pct: actualYieldData.variance_pct,
          status: actualYieldData.status,
          loss_value: actualYieldData.loss_value,
        });
      }

      return {
        packing_list_id,
        packing_list_no: packingList.packing_list_no,
        yield_results: yieldResults,
        overall_status: this.determineOverallStatus(yieldResults),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get yield standard for a product configuration
   * @param {Object} params - { species_id, product_form, processing_type }
   * @returns {Object} - Yield standard
   */
  static async getYieldStandard({
    species_id,
    derivative_id,
    processing_type,
  }) {
    try {
      const yieldStandard = await YieldStandardMaster.findOne({
        where: {
          species_id,
          derivative_id,
          processing_type,
          is_active: true,
        },
      });

      return yieldStandard;
    } catch (error) {
      console.error("Error getting yield standard:", error);
      return null;
    }
  }

  /**
   * Determine processing type from order product
   * @param {Object} orderProduct - Order product object
   * @returns {string} - Processing type
   */
  static determineProcessingType(orderProduct) {
    // This is a simplified logic - in real implementation,
    // this would be determined from product master data
    const productName = orderProduct.product_name?.toLowerCase() || "";

    if (productName.includes("hoso")) return "HOSO";
    if (productName.includes("hlso")) return "HLSO";
    if (productName.includes("pud")) return "PUD";
    if (productName.includes("cleaned")) return "CLEANED";
    if (productName.includes("cooked")) return "COOKED";

    return "STANDARD"; // Default
  }

  /**
   * Calculate actual yield from procurement and packing data
   * @param {Object} params - { order_product, packing_list, yield_standard }
   * @returns {Object} - Actual yield calculations
   */
  static async calculateActualYield({
    order_product,
    packing_list,
    yield_standard,
  }) {
    try {
      // In a real implementation, this would pull from procurement lots
      // For now, using simplified calculations based on order quantity

      const quantity = order_product.quantity || 0;
      const rawCostPerKg = order_product.rate || 0;

      // Assume raw input is 110% of ordered quantity (accounting for losses)
      const rawInputKg = quantity * 1.1;

      // Saleable output is the ordered quantity
      const saleableOutputKg = quantity;

      // Calculate actual yield
      const actualYieldPct = (saleableOutputKg / rawInputKg) * 100;

      // Calculate variance
      const expectedYieldPct = yield_standard.expected_yield_pct;
      const variancePct = actualYieldPct - expectedYieldPct;

      // Calculate losses
      const lossKg = rawInputKg - saleableOutputKg;
      const lossValue = lossKg * rawCostPerKg;

      // Determine status
      const allowedVariance = yield_standard.allowed_variance_pct;
      let status = "OK";
      let reasonCodes = [];

      if (Math.abs(variancePct) > allowedVariance * 2) {
        status = "BREACH";
        reasonCodes.push("LOW_YIELD");
      } else if (Math.abs(variancePct) > allowedVariance) {
        status = "WARNING";
        reasonCodes.push("YIELD_VARIANCE");
      }

      return {
        raw_input_kg: rawInputKg,
        raw_cost_per_kg: rawCostPerKg,
        saleable_output_kg: saleableOutputKg,
        actual_yield_pct: actualYieldPct,
        variance_pct: variancePct,
        loss_kg: lossKg,
        loss_value: lossValue,
        status,
        reason_codes: reasonCodes,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Determine overall status from multiple yield results
   * @param {Array} yieldResults - Array of yield result objects
   * @returns {string} - Overall status
   */
  static determineOverallStatus(yieldResults) {
    if (yieldResults.some((result) => result.status === "BREACH")) {
      return "BREACH";
    }
    if (yieldResults.some((result) => result.status === "WARNING")) {
      return "WARNING";
    }
    return "OK";
  }

  /**
   * Calculate margin variance for invoice
   * @param {Object} params - { invoice_id, profile_id }
   * @returns {Object} - Margin variance result
   */
  static async calculateMarginVariance({ invoice_id, profile_id }) {
    try {
      // Get invoice with line items
      const invoice = await models.Invoice.findOne({
        where: {
          id: invoice_id,
          is_active: true,
        },
        include: [
          {
            model: models.InvoiceLineItem,
            as: "lineItems",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Get yield actual for this invoice's packing list
      const yieldActuals = await YieldActual.findAll({
        where: {
          packing_list_id: invoice.packing_list_id,
          is_active: true,
        },
      });

      if (!yieldActuals || yieldActuals.length === 0) {
        throw new Error("No yield data found for this invoice");
      }

      const marginVariances = [];

      for (const lineItem of invoice.lineItems) {
        // Find corresponding yield actual
        const yieldActual = yieldActuals.find(
          (ya) => ya.species_id === lineItem.product_id,
        );

        if (!yieldActual) continue;

        // Calculate margin variance
        const saleQuantityKg = lineItem.quantity;
        const standardCostPerKg =
          yieldActual.raw_cost_per_kg / (yieldActual.expected_yield_pct / 100);
        const actualCostPerKg =
          yieldActual.raw_cost_per_kg / (yieldActual.actual_yield_pct / 100);
        const marginVarianceValue =
          (standardCostPerKg - actualCostPerKg) * saleQuantityKg;

        // Determine accounting treatment
        let accountingTreatment = "NORMAL_LOSS";
        if (yieldActual.status === "BREACH") {
          accountingTreatment = "EXCESS_LOSS_EXPENSE";
        }

        // Create margin variance record
        const marginVariance = await models.MarginVariance.create({
          invoice_id,
          yield_actual_id: yieldActual.id,
          sale_quantity_kg: saleQuantityKg,
          standard_cost_per_kg: standardCostPerKg,
          actual_cost_per_kg: actualCostPerKg,
          margin_variance_value: marginVarianceValue,
          reason_codes: yieldActual.reason_codes,
          accounting_treatment: accountingTreatment,
          created_by: profile_id,
          updated_by: profile_id,
        });

        marginVariances.push({
          margin_variance_id: marginVariance.id,
          product_name: lineItem.product_name,
          sale_quantity_kg: saleQuantityKg,
          standard_cost_per_kg: standardCostPerKg,
          actual_cost_per_kg: actualCostPerKg,
          margin_variance_value: marginVarianceValue,
          accounting_treatment: accountingTreatment,
        });
      }

      const totalMarginVariance = marginVariances.reduce(
        (sum, mv) => sum + parseFloat(mv.margin_variance_value),
        0,
      );

      return {
        invoice_id,
        invoice_no: invoice.invoice_no,
        margin_variances: marginVariances,
        total_margin_variance: totalMarginVariance,
        requires_supervisor_approval: yieldActuals.some(
          (ya) => ya.status === "BREACH",
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate procurement requirements based on yield standards
   * @param {Object} params - { productId, quantityRequired, speciesId, productCategoryId, productForm, processingType }
   * @returns {Object} - Procurement requirements with yield-based calculations
   */
  static async calculateProcurementRequirements({
    productId,
    quantityRequired,
    speciesId,
    productCategoryId,
    processingType = "RAW",
  }) {
    try {
      // Use RawMaterialCalculator for the core calculation
      const result =
        await RawMaterialCalculator.calculateRawMaterialRequirements({
          productId,
          quantityRequired,
          speciesId,
          productCategoryId,
          processingType,
        });

      if (!result.success) {
        throw new Error(
          result.error || "Failed to calculate procurement requirements",
        );
      }

      // Enhance with yield-specific insights
      const yieldInsights = await this._getYieldInsightsForProcurement({
        speciesId,
        derivativeId: result.data.derivativeId,
        processingType,
      });

      return {
        ...result.data,
        yieldInsights,
        procurementStrategy: this._generateProcurementStrategy(
          result.data,
          yieldInsights,
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get procurement recommendations across multiple product categories
   * @param {Object} params - { productId, quantityRequired, speciesId }
   * @returns {Array} - Array of procurement recommendations
   */
  static async getProcurementRecommendations({
    productId,
    quantityRequired,
    speciesId,
  }) {
    try {
      const result =
        await RawMaterialCalculator.getMultiCategoryRecommendations({
          productId,
          quantityRequired,
          speciesId,
        });

      if (!result.success) {
        throw new Error(
          result.error || "Failed to get procurement recommendations",
        );
      }

      // Enhance each recommendation with yield insights
      const enhancedRecommendations = await Promise.all(
        result.data.map(async (recommendation) => {
          const yieldInsights = await this._getYieldInsightsForProcurement({
            speciesId,
            productForm: recommendation.productForm,
            processingType: recommendation.processingType,
          });

          return {
            ...recommendation,
            yieldInsights,
            procurementStrategy: this._generateProcurementStrategy(
              recommendation,
              yieldInsights,
            ),
          };
        }),
      );

      return enhancedRecommendations;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get yield-informed procurement requirements (combines historical yield data with predictions)
   * @param {Object} params - { productId, quantityRequired, speciesId, includeHistoricalAnalysis }
   * @returns {Object} - Enhanced procurement requirements with historical context
   */
  static async getYieldInformedProcurement({
    productId,
    quantityRequired,
    speciesId,
    includeHistoricalAnalysis = true,
  }) {
    try {
      // Get basic procurement requirements
      const procurementReqs = await this.calculateProcurementRequirements({
        productId,
        quantityRequired,
        speciesId,
      });

      if (!includeHistoricalAnalysis) {
        return procurementReqs;
      }

      // Get historical yield analysis for the species
      const historicalAnalysis =
        await this._getHistoricalYieldAnalysis(speciesId);

      // Adjust procurement recommendations based on historical performance
      const adjustedRequirements = this._adjustForHistoricalPerformance(
        procurementReqs,
        historicalAnalysis,
      );

      return {
        ...adjustedRequirements,
        historicalAnalysis,
        adjustments: this._calculateProcurementAdjustments(
          procurementReqs,
          adjustedRequirements,
        ),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get yield insights for procurement planning
   * @private
   */
  static async _getYieldInsightsForProcurement({
    speciesId,
    derivativeId,
    processingType,
  }) {
    try {
      // Get yield standards
      const yieldStandard = await this.getYieldStandard({
        species_id: speciesId,
        derivative_id: derivativeId,
        processing_type: processingType,
      });

      if (!yieldStandard) {
        return {
          hasYieldStandard: false,
          riskLevel: "HIGH",
          recommendedBuffer: 0.15, // 15% buffer when no standards exist
          notes: "No yield standard found - using conservative estimates",
        };
      }

      // Get recent yield performance from production execution
      const recentExecutions = await models.ProductionExecution.findAll({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          processing_type: processingType,
          status: { [models.Sequelize.Op.in]: ["PASS", "HOLD"] }, // Only consider valid executions
          executed_at: {
            [models.Sequelize.Op.gte]: new Date(
              Date.now() - 90 * 24 * 60 * 60 * 1000,
            ), // Last 90 days
          },
        },
        attributes: ["actual_yield_pct"],
        order: [["executed_at", "DESC"]],
        limit: 10,
        raw: true,
      });

      const avgActualYield =
        recentExecutions.length > 0
          ? recentExecutions.reduce(
              (sum, exec) => sum + parseFloat(exec.actual_yield_pct),
              0,
            ) / recentExecutions.length
          : yieldStandard.expected_yield_pct;

      const yieldVariance = Math.abs(
        avgActualYield - yieldStandard.expected_yield_pct,
      );
      const variancePercentage =
        (yieldVariance / yieldStandard.expected_yield_pct) * 100;

      let riskLevel = "LOW";
      let recommendedBuffer = 0.05; // 5% base buffer

      if (variancePercentage > 15) {
        riskLevel = "HIGH";
        recommendedBuffer = 0.2; // 20% buffer for high variance
      } else if (variancePercentage > 8) {
        riskLevel = "MEDIUM";
        recommendedBuffer = 0.12; // 12% buffer for medium variance
      }

      return {
        hasYieldStandard: true,
        expectedYieldPct: yieldStandard.expected_yield_pct,
        avgActualYieldPct: avgActualYield,
        yieldVariancePct: variancePercentage,
        riskLevel,
        recommendedBuffer,
        sampleSize: recentExecutions.length,
        yieldStability:
          variancePercentage <= 5
            ? "STABLE"
            : variancePercentage <= 10
              ? "MODERATE"
              : "VOLATILE",
      };
    } catch (error) {
      console.warn("Error getting yield insights:", error.message);
      return {
        hasYieldStandard: false,
        riskLevel: "UNKNOWN",
        recommendedBuffer: 0.1,
        notes: "Could not retrieve yield insights",
      };
    }
  }

  /**
   * Generate procurement strategy based on calculations and yield insights
   * @private
   */
  static _generateProcurementStrategy(calculations, yieldInsights) {
    const strategy = {
      recommendedApproach: "",
      orderFrequency: "",
      safetyStockLevel: "",
      supplierDiversification: "",
      monitoringFrequency: "",
    };

    const orderQty = calculations.recommendedOrderQuantity;
    const riskLevel = yieldInsights.riskLevel;

    // Determine approach based on order quantity and risk
    if (orderQty <= calculations.rawMaterialNeeded * 0.1) {
      strategy.recommendedApproach = "JUST_IN_TIME";
      strategy.orderFrequency = "AS_NEEDED";
    } else if (orderQty <= calculations.rawMaterialNeeded * 0.5) {
      strategy.recommendedApproach = "BATCH_ORDERING";
      strategy.orderFrequency = "WEEKLY";
    } else {
      strategy.recommendedApproach = "BULK_ORDERING";
      strategy.orderFrequency = "MONTHLY";
    }

    // Safety stock based on risk level
    if (riskLevel === "HIGH") {
      strategy.safetyStockLevel = "HIGH (25-30% of monthly usage)";
      strategy.supplierDiversification = "MULTIPLE_SUPPLIERS";
      strategy.monitoringFrequency = "DAILY";
    } else if (riskLevel === "MEDIUM") {
      strategy.safetyStockLevel = "MEDIUM (15-20% of monthly usage)";
      strategy.supplierDiversification = "PRIMARY_WITH_BACKUP";
      strategy.monitoringFrequency = "WEEKLY";
    } else {
      strategy.safetyStockLevel = "LOW (5-10% of monthly usage)";
      strategy.supplierDiversification = "SINGLE_RELIABLE_SUPPLIER";
      strategy.monitoringFrequency = "MONTHLY";
    }

    return strategy;
  }

  /**
   * Get historical yield analysis for procurement adjustment
   * @private
   */
  static async _getHistoricalYieldAnalysis(speciesId) {
    try {
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

      const historicalYields = await YieldActual.findAll({
        where: {
          species_id: speciesId,
          is_active: true,
          created_at: {
            [models.Sequelize.Op.gte]: sixMonthsAgo,
          },
        },
        attributes: [
          "actual_yield_pct",
          "expected_yield_pct",
          "variance_pct",
          "status",
          "created_at",
        ],
        order: [["created_at", "DESC"]],
      });

      if (historicalYields.length === 0) {
        return {
          hasHistoricalData: false,
          avgYieldVariance: 0,
          yieldTrend: "UNKNOWN",
          recommendation: "Use standard yield assumptions",
        };
      }

      const avgVariance =
        historicalYields.reduce(
          (sum, y) => sum + Math.abs(parseFloat(y.variance_pct)),
          0,
        ) / historicalYields.length;
      const recentYields = historicalYields.slice(
        0,
        Math.min(5, historicalYields.length),
      );
      const olderYields = historicalYields.slice(
        Math.min(5, historicalYields.length),
      );

      const recentAvg =
        recentYields.reduce(
          (sum, y) => sum + parseFloat(y.actual_yield_pct),
          0,
        ) / recentYields.length;
      const olderAvg =
        olderYields.length > 0
          ? olderYields.reduce(
              (sum, y) => sum + parseFloat(y.actual_yield_pct),
              0,
            ) / olderYields.length
          : recentAvg;

      const yieldTrend =
        recentAvg > olderAvg
          ? "IMPROVING"
          : recentAvg < olderAvg
            ? "DECLINING"
            : "STABLE";

      return {
        hasHistoricalData: true,
        totalSamples: historicalYields.length,
        avgYieldVariance: avgVariance,
        yieldTrend,
        recentAvgYield: recentAvg,
        overallAvgYield:
          historicalYields.reduce(
            (sum, y) => sum + parseFloat(y.actual_yield_pct),
            0,
          ) / historicalYields.length,
        breachRate:
          (historicalYields.filter((y) => y.status === "BREACH").length /
            historicalYields.length) *
          100,
      };
    } catch (error) {
      console.warn("Error getting historical yield analysis:", error.message);
      return {
        hasHistoricalData: false,
        error: error.message,
      };
    }
  }

  /**
   * Adjust procurement requirements based on historical performance
   * @private
   */
  static _adjustForHistoricalPerformance(procurementReqs, historicalAnalysis) {
    if (!historicalAnalysis.hasHistoricalData) {
      return procurementReqs;
    }

    const adjusted = { ...procurementReqs };

    // Increase buffer for high variance species
    if (historicalAnalysis.avgYieldVariance > 10) {
      const additionalBuffer = Math.ceil(
        procurementReqs.rawMaterialNeeded *
          (historicalAnalysis.avgYieldVariance / 100) *
          0.5,
      );
      adjusted.rawMaterialNeeded += additionalBuffer;
      adjusted.totalWithBuffer += additionalBuffer;
      adjusted.inventoryGap = Math.max(
        0,
        adjusted.totalWithBuffer - procurementReqs.currentInventory,
      );
      adjusted.recommendedOrderQuantity = Math.max(0, adjusted.inventoryGap);
    }

    // Adjust for declining yield trend
    if (historicalAnalysis.yieldTrend === "DECLINING") {
      const trendAdjustment = Math.ceil(
        procurementReqs.rawMaterialNeeded * 0.08,
      ); // 8% additional buffer
      adjusted.rawMaterialNeeded += trendAdjustment;
      adjusted.totalWithBuffer += trendAdjustment;
      adjusted.inventoryGap = Math.max(
        0,
        adjusted.totalWithBuffer - procurementReqs.currentInventory,
      );
      adjusted.recommendedOrderQuantity = Math.max(0, adjusted.inventoryGap);
    }

    return adjusted;
  }

  /**
   * Calculate what adjustments were made to procurement requirements
   * @private
   */
  static _calculateProcurementAdjustments(original, adjusted) {
    const adjustments = [];

    if (adjusted.rawMaterialNeeded !== original.rawMaterialNeeded) {
      adjustments.push({
        type: "RAW_MATERIAL_INCREASE",
        originalValue: original.rawMaterialNeeded,
        adjustedValue: adjusted.rawMaterialNeeded,
        difference: adjusted.rawMaterialNeeded - original.rawMaterialNeeded,
        reason: "Historical yield variance adjustment",
      });
    }

    if (
      adjusted.recommendedOrderQuantity !== original.recommendedOrderQuantity
    ) {
      adjustments.push({
        type: "ORDER_QUANTITY_CHANGE",
        originalValue: original.recommendedOrderQuantity,
        adjustedValue: adjusted.recommendedOrderQuantity,
        difference:
          adjusted.recommendedOrderQuantity - original.recommendedOrderQuantity,
        reason: "Inventory gap and historical performance adjustment",
      });
    }

    return adjustments;
  }

  /**
   * Get yield dashboard data
   * @param {Object} params - { start_date, end_date, species_id }
   * @returns {Object} - Dashboard data
   */
  static async getYieldDashboard({ start_date, end_date, species_id }) {
    try {
      const whereClause = {
        is_active: true,
        created_at: {
          [models.Sequelize.Op.between]: [start_date, end_date],
        },
      };

      if (species_id) {
        whereClause.species_id = species_id;
      }

      const yieldData = await YieldActual.findAll({
        where: whereClause,
        include: [
          {
            model: models.SpeciesMaster,
            as: "species",
            attributes: ["species_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Calculate dashboard metrics
      const totalRecords = yieldData.length;
      const okCount = yieldData.filter((y) => y.status === "OK").length;
      const warningCount = yieldData.filter(
        (y) => y.status === "WARNING",
      ).length;
      const breachCount = yieldData.filter((y) => y.status === "BREACH").length;

      const avgYieldPct =
        yieldData.reduce((sum, y) => sum + parseFloat(y.actual_yield_pct), 0) /
        totalRecords;
      const totalLossValue = yieldData.reduce(
        (sum, y) => sum + parseFloat(y.loss_value),
        0,
      );

      // Group by species
      const bySpecies = {};
      yieldData.forEach((y) => {
        const speciesName = y.species?.species_name || "Unknown";
        if (!bySpecies[speciesName]) {
          bySpecies[speciesName] = {
            count: 0,
            total_loss_value: 0,
            avg_yield_pct: 0,
          };
        }
        bySpecies[speciesName].count++;
        bySpecies[speciesName].total_loss_value += parseFloat(y.loss_value);
        bySpecies[speciesName].avg_yield_pct += parseFloat(y.actual_yield_pct);
      });

      Object.keys(bySpecies).forEach((species) => {
        bySpecies[species].avg_yield_pct /= bySpecies[species].count;
      });

      return {
        summary: {
          total_records: totalRecords,
          ok_count: okCount,
          warning_count: warningCount,
          breach_count: breachCount,
          avg_yield_pct: avgYieldPct.toFixed(2),
          total_loss_value: totalLossValue.toFixed(2),
        },
        by_species: bySpecies,
        recent_yields: yieldData.slice(0, 10).map((y) => ({
          id: y.id,
          species_name: y.species?.species_name,
          actual_yield_pct: y.actual_yield_pct,
          variance_pct: y.variance_pct,
          status: y.status,
          loss_value: y.loss_value,
          created_at: y.created_at,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive quantity recommendations for ordering
   * @param {Object} params - { productId, requiredQuantity, speciesId, currentInventory, leadTime, orderCycle, marketConditions }
   * @returns {Object} - Detailed quantity recommendations with rationale
   */
  static async getQuantityRecommendations({
    productId,
    requiredQuantity,
    speciesId,
    currentInventory = 0,
    leadTime = 7, // days
    orderCycle = 30, // days
    marketConditions = {},
  }) {
    try {
      // First, get the product to determine its derivative
      const product = await models.ProductMaster.findOne({
        where: { id: productId, is_active: true },
        attributes: ["id", "derivative_master_id"],
        raw: true,
      });

      if (!product || !product.derivative_master_id) {
        throw new Error(
          `Product ${productId} not found or has no derivative assigned`,
        );
      }

      const derivativeId = product.derivative_master_id;

      // Get base procurement requirements - try RAW first, then COOKED as fallback
      let baseRequirements;
      try {
        baseRequirements = await this.calculateProcurementRequirements({
          productId,
          quantityRequired: requiredQuantity,
          speciesId,
          processingType: "RAW",
        });
      } catch (error) {
        // If RAW doesn't work, try COOKED processing type
        try {
          baseRequirements = await this.calculateProcurementRequirements({
            productId,
            quantityRequired: requiredQuantity,
            speciesId,
            processingType: "COOKED",
          });
        } catch (fallbackError) {
          throw new Error(
            `No yield standards available for species ${speciesId}, derivative ${derivativeId}`,
          );
        }
      }

      // Get historical yield analysis
      const historicalAnalysis =
        await this._getHistoricalYieldAnalysis(speciesId);

      // Calculate safety stock based on yield risk
      const safetyStock = this._calculateSafetyStock({
        baseRequirements,
        historicalAnalysis,
        leadTime,
        orderCycle,
      });

      // Calculate economic order quantity
      const eoq = this._calculateEconomicOrderQuantity({
        baseRequirements,
        historicalAnalysis,
        orderCycle,
      });

      // Apply seasonal adjustments
      const seasonalAdjustment =
        await this._calculateSeasonalAdjustment(speciesId);

      // Calculate total recommended quantity
      const recommendedQuantity = this._calculateTotalRecommendedQuantity({
        baseRequirements,
        safetyStock,
        eoq,
        seasonalAdjustment,
        currentInventory,
        marketConditions,
      });

      // Generate ordering strategy
      const orderingStrategy = this._generateOrderingStrategy({
        recommendedQuantity,
        baseRequirements,
        safetyStock,
        leadTime,
        orderCycle,
      });

      return {
        productId,
        speciesId,
        baseRequirements: {
          rawMaterialNeeded: baseRequirements.rawMaterialNeeded,
          currentInventory: baseRequirements.currentInventory,
          inventoryGap: baseRequirements.inventoryGap,
          recommendedOrderQuantity: baseRequirements.recommendedOrderQuantity,
        },
        yieldAnalysis: {
          hasHistoricalData: historicalAnalysis.hasHistoricalData,
          avgYieldVariance: historicalAnalysis.avgYieldVariance,
          yieldTrend: historicalAnalysis.yieldTrend,
          riskLevel: baseRequirements.yieldInsights?.riskLevel || "UNKNOWN",
        },
        safetyStock: {
          quantity: safetyStock.quantity,
          rationale: safetyStock.rationale,
          coverageDays: safetyStock.coverageDays,
        },
        economicOrderQuantity: {
          quantity: eoq.quantity,
          annualDemand: eoq.annualDemand,
          orderingCost: eoq.orderingCost,
          holdingCost: eoq.holdingCost,
        },
        seasonalAdjustment: {
          factor: seasonalAdjustment.factor,
          reason: seasonalAdjustment.reason,
          adjustmentQuantity: seasonalAdjustment.adjustmentQuantity,
        },
        marketAdjustments: this._calculateMarketAdjustments(marketConditions),
        finalRecommendation: {
          totalRecommendedQuantity: recommendedQuantity.total,
          immediateOrderQuantity: recommendedQuantity.immediate,
          phasedOrderQuantities: recommendedQuantity.phased,
          confidenceLevel: recommendedQuantity.confidence,
        },
        orderingStrategy,
        costAnalysis: this._calculateCostAnalysis({
          recommendedQuantity: recommendedQuantity.total,
          baseRequirements,
          marketConditions,
        }),
        riskAssessment: this._assessProcurementRisk({
          baseRequirements,
          historicalAnalysis,
          marketConditions,
        }),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate quantity recommendations: ${error.message}`,
      );
    }
  }

  /**
   * Calculate safety stock based on yield risk and lead times
   * @private
   */
  static _calculateSafetyStock({
    baseRequirements,
    historicalAnalysis,
    leadTime,
    orderCycle,
  }) {
    const yieldInsights = baseRequirements.yieldInsights || {};
    const riskLevel = yieldInsights.riskLevel || "MEDIUM";

    // Base safety stock factors by risk level
    const riskFactors = {
      LOW: 0.1, // 10% of average demand
      MEDIUM: 0.2, // 20% of average demand
      HIGH: 0.35, // 35% of average demand
      UNKNOWN: 0.25, // 25% conservative default
    };

    const riskFactor = riskFactors[riskLevel] || 0.25;

    // Calculate average daily demand
    const avgDailyDemand = baseRequirements.rawMaterialNeeded / orderCycle;

    // Safety stock = (Average daily demand × Lead time) × Risk factor
    const baseSafetyStock = avgDailyDemand * leadTime * riskFactor;

    // Adjust for yield variance
    let varianceAdjustment = 1.0;
    if (historicalAnalysis.hasHistoricalData) {
      const yieldVariance = historicalAnalysis.avgYieldVariance;
      if (yieldVariance > 15) {
        varianceAdjustment = 1.3; // 30% increase for high variance
      } else if (yieldVariance > 8) {
        varianceAdjustment = 1.15; // 15% increase for medium variance
      }
    }

    const adjustedSafetyStock = baseSafetyStock * varianceAdjustment;

    return {
      quantity: Math.ceil(adjustedSafetyStock),
      coverageDays: Math.ceil(adjustedSafetyStock / avgDailyDemand || leadTime),
      rationale: `Safety stock calculated for ${riskLevel} risk level with ${leadTime}-day lead time and ${varianceAdjustment > 1 ? "yield variance adjustment" : "standard parameters"}`,
    };
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   * @private
   */
  static _calculateEconomicOrderQuantity({
    baseRequirements,
    historicalAnalysis,
    orderCycle,
  }) {
    // Estimate annual demand
    const monthlyDemand = baseRequirements.rawMaterialNeeded;
    const annualDemand = monthlyDemand * 12;

    // Estimated costs (these could be configurable)
    const orderingCost = 100; // Cost per order
    const holdingCostRate = 0.2; // 20% annual holding cost rate
    const unitCost = 10; // Estimated unit cost

    const holdingCost = unitCost * holdingCostRate;

    // EOQ formula: sqrt(2DS/H)
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);

    return {
      quantity: Math.ceil(eoq),
      annualDemand,
      orderingCost,
      holdingCost: holdingCost.toFixed(2),
    };
  }

  /**
   * Calculate seasonal adjustments
   * @private
   */
  static async _calculateSeasonalAdjustment(speciesId) {
    try {
      // Get yield data for the last 12 months to identify seasonal patterns
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      const seasonalData = await YieldActual.findAll({
        where: {
          species_id: speciesId,
          is_active: true,
          created_at: {
            [models.Sequelize.Op.gte]: oneYearAgo,
          },
        },
        attributes: ["actual_yield_pct", "created_at"],
        order: [["created_at", "ASC"]],
      });

      if (seasonalData.length < 12) {
        return {
          factor: 1.0,
          reason: "Insufficient historical data for seasonal analysis",
          adjustmentQuantity: 0,
        };
      }

      // Group by month and calculate average yield
      const monthlyYields = {};
      seasonalData.forEach((record) => {
        const month = record.created_at.getMonth();
        if (!monthlyYields[month]) {
          monthlyYields[month] = [];
        }
        monthlyYields[month].push(parseFloat(record.actual_yield_pct));
      });

      const currentMonth = new Date().getMonth();
      const currentMonthAvg = monthlyYields[currentMonth]
        ? monthlyYields[currentMonth].reduce((sum, y) => sum + y, 0) /
          monthlyYields[currentMonth].length
        : 85; // Default

      const overallAvg =
        seasonalData.reduce(
          (sum, y) => sum + parseFloat(y.actual_yield_pct),
          0,
        ) / seasonalData.length;

      const seasonalFactor = overallAvg / currentMonthAvg;

      return {
        factor: seasonalFactor,
        reason: `Current month (${new Date().toLocaleString("default", { month: "long" })}) yield performance ${seasonalFactor > 1.05 ? "below" : seasonalFactor < 0.95 ? "above" : "at"} seasonal average`,
        adjustmentQuantity: 0, // Will be calculated in main method
      };
    } catch (error) {
      console.warn("Error calculating seasonal adjustment:", error.message);
      return {
        factor: 1.0,
        reason: "Could not calculate seasonal adjustment",
        adjustmentQuantity: 0,
      };
    }
  }

  /**
   * Calculate total recommended quantity incorporating all factors
   * @private
   */
  static _calculateTotalRecommendedQuantity({
    baseRequirements,
    safetyStock,
    eoq,
    seasonalAdjustment,
    currentInventory,
    marketConditions,
  }) {
    const baseOrderQuantity = Math.max(0, baseRequirements.inventoryGap);

    // Apply safety stock
    const withSafetyStock = baseOrderQuantity + safetyStock.quantity;

    // Apply EOQ considerations (round up to nearest EOQ multiple for efficiency)
    const eoqMultiple = Math.ceil(withSafetyStock / eoq.quantity);
    const eoqAdjusted = eoqMultiple * eoq.quantity;

    // Apply seasonal adjustment
    const seasonalAdjusted = eoqAdjusted * seasonalAdjustment.factor;

    // Apply market conditions
    const marketAdjusted = this._applyMarketAdjustments(
      seasonalAdjusted,
      marketConditions,
    );

    // Calculate confidence level
    const confidenceLevel = this._calculateConfidenceLevel({
      baseRequirements,
      safetyStock,
      seasonalAdjustment,
      marketConditions,
    });

    // Determine immediate vs phased ordering
    const immediateOrder = Math.min(marketAdjusted, eoq.quantity * 2); // Max 2 EOQs at once
    const remainingOrder = Math.max(0, marketAdjusted - immediateOrder);

    return {
      total: Math.ceil(marketAdjusted),
      immediate: Math.ceil(immediateOrder),
      phased:
        remainingOrder > 0
          ? [
              {
                quantity: Math.ceil(remainingOrder * 0.6),
                timing: "2 weeks",
                reason: "EOQ optimization and cash flow management",
              },
              {
                quantity: Math.ceil(remainingOrder * 0.4),
                timing: "4 weeks",
                reason: "Seasonal adjustment and risk mitigation",
              },
            ]
          : [],
      confidence: confidenceLevel,
    };
  }

  /**
   * Generate ordering strategy recommendations
   * @private
   */
  static _generateOrderingStrategy({
    recommendedQuantity,
    baseRequirements,
    safetyStock,
    leadTime,
    orderCycle,
  }) {
    const strategy = {
      approach: "",
      frequency: "",
      supplierStrategy: "",
      monitoring: "",
      contingencies: [],
    };

    const totalQuantity = recommendedQuantity.total;
    const riskLevel = baseRequirements.yieldInsights?.riskLevel || "MEDIUM";

    // Determine ordering approach
    if (totalQuantity < baseRequirements.rawMaterialNeeded * 0.5) {
      strategy.approach = "JUST_IN_TIME";
      strategy.frequency = "AS_NEEDED";
    } else if (totalQuantity < baseRequirements.rawMaterialNeeded * 2) {
      strategy.approach = "BATCH_ORDERING";
      strategy.frequency = "WEEKLY";
    } else {
      strategy.approach = "BULK_ORDERING";
      strategy.frequency = "MONTHLY";
    }

    // Supplier strategy based on risk
    if (riskLevel === "HIGH") {
      strategy.supplierStrategy = "MULTIPLE_SUPPLIERS_WITH_BACKUPS";
    } else if (riskLevel === "MEDIUM") {
      strategy.supplierStrategy = "PRIMARY_SUPPLIER_WITH_BACKUP";
    } else {
      strategy.supplierStrategy = "SINGLE_RELIABLE_SUPPLIER";
    }

    // Monitoring frequency
    strategy.monitoring =
      riskLevel === "HIGH"
        ? "DAILY"
        : riskLevel === "MEDIUM"
          ? "WEEKLY"
          : "MONTHLY";

    // Contingency plans
    if (safetyStock.quantity > 0) {
      strategy.contingencies.push(
        `Maintain ${safetyStock.quantity} units safety stock`,
      );
    }
    if (leadTime > 14) {
      strategy.contingencies.push("Consider expedited shipping options");
    }
    if (riskLevel === "HIGH") {
      strategy.contingencies.push("Establish alternative sourcing agreements");
    }

    return strategy;
  }

  /**
   * Calculate market-based adjustments
   * @private
   */
  static _calculateMarketAdjustments(marketConditions = {}) {
    const adjustments = {
      priceVolatility: 0,
      supplyDisruption: 0,
      demandForecast: 0,
      totalAdjustment: 0,
    };

    // Price volatility adjustment (increase stock if prices are volatile)
    if (marketConditions.priceVolatility === "HIGH") {
      adjustments.priceVolatility = 0.15; // 15% increase
    } else if (marketConditions.priceVolatility === "MEDIUM") {
      adjustments.priceVolatility = 0.08; // 8% increase
    }

    // Supply disruption adjustment
    if (marketConditions.supplyDisruption === "HIGH") {
      adjustments.supplyDisruption = 0.25; // 25% increase
    } else if (marketConditions.supplyDisruption === "MEDIUM") {
      adjustments.supplyDisruption = 0.12; // 12% increase
    }

    // Demand forecast adjustment
    if (marketConditions.demandForecast === "INCREASING") {
      adjustments.demandForecast = 0.1; // 10% increase
    } else if (marketConditions.demandForecast === "DECREASING") {
      adjustments.demandForecast = -0.05; // 5% decrease
    }

    adjustments.totalAdjustment =
      adjustments.priceVolatility +
      adjustments.supplyDisruption +
      adjustments.demandForecast;

    return adjustments;
  }

  /**
   * Apply market adjustments to quantity
   * @private
   */
  static _applyMarketAdjustments(quantity, marketConditions) {
    const marketAdjustments =
      this._calculateMarketAdjustments(marketConditions);
    return quantity * (1 + marketAdjustments.totalAdjustment);
  }

  /**
   * Calculate confidence level in recommendations
   * @private
   */
  static _calculateConfidenceLevel({
    baseRequirements,
    safetyStock,
    seasonalAdjustment,
    marketConditions,
  }) {
    let confidence = 100;

    // Reduce confidence based on various factors
    if (!baseRequirements.yieldInsights?.hasYieldStandard) {
      confidence -= 20;
    }

    if (baseRequirements.yieldInsights?.riskLevel === "HIGH") {
      confidence -= 15;
    }

    if (seasonalAdjustment.factor !== 1.0) {
      confidence -= 10;
    }

    if (Object.keys(marketConditions).length > 0) {
      confidence -= 5;
    }

    return Math.max(60, confidence); // Minimum 60% confidence
  }

  /**
   * Calculate cost analysis for recommendations
   * @private
   */
  static _calculateCostAnalysis({
    recommendedQuantity,
    baseRequirements,
    marketConditions,
  }) {
    const estimatedUnitCost = 10; // This should come from actual pricing data
    const totalCost = recommendedQuantity * estimatedUnitCost;

    const marketPremium =
      marketConditions.priceVolatility === "HIGH"
        ? 0.1
        : marketConditions.priceVolatility === "MEDIUM"
          ? 0.05
          : 0;

    return {
      estimatedUnitCost,
      totalMaterialCost: totalCost,
      marketPremium: totalCost * marketPremium,
      totalEstimatedCost: totalCost * (1 + marketPremium),
      costPerUnitProduced:
        totalCost / (baseRequirements.rawMaterialNeeded || 1),
    };
  }

  /**
   * Assess procurement risk
   * @private
   */
  static _assessProcurementRisk({
    baseRequirements,
    historicalAnalysis,
    marketConditions,
  }) {
    const risks = {
      yieldRisk: "LOW",
      supplyRisk: "LOW",
      marketRisk: "LOW",
      overallRisk: "LOW",
      mitigationStrategies: [],
    };

    // Yield risk assessment
    if (baseRequirements.yieldInsights?.riskLevel === "HIGH") {
      risks.yieldRisk = "HIGH";
      risks.mitigationStrategies.push("Increase safety stock by 25%");
    } else if (baseRequirements.yieldInsights?.riskLevel === "MEDIUM") {
      risks.yieldRisk = "MEDIUM";
      risks.mitigationStrategies.push("Increase safety stock by 15%");
    }

    // Supply risk assessment
    if (
      historicalAnalysis.hasHistoricalData &&
      historicalAnalysis.breachRate > 20
    ) {
      risks.supplyRisk = "HIGH";
      risks.mitigationStrategies.push("Diversify suppliers");
    }

    // Market risk assessment
    if (
      marketConditions.supplyDisruption === "HIGH" ||
      marketConditions.priceVolatility === "HIGH"
    ) {
      risks.marketRisk = "HIGH";
      risks.mitigationStrategies.push("Consider forward contracts");
    }

    // Overall risk
    if (
      [risks.yieldRisk, risks.supplyRisk, risks.marketRisk].includes("HIGH")
    ) {
      risks.overallRisk = "HIGH";
    } else if (
      [risks.yieldRisk, risks.supplyRisk, risks.marketRisk].includes("MEDIUM")
    ) {
      risks.overallRisk = "MEDIUM";
    }

    return risks;
  }

  /**
   * Find an available processing type for a species and product form
   * @private
   */
  static async _findAvailableProcessingType(speciesId, derivativeId) {
    try {
      const yieldStandard = await YieldStandardMaster.findOne({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          is_active: true,
        },
        order: [["expected_yield_pct", "DESC"]], // Prefer higher yield standards
      });

      return yieldStandard ? yieldStandard.processing_type : null;
    } catch (error) {
      console.warn(
        `Failed to find processing type for species ${speciesId}, derivative ${derivativeId}:`,
        error.message,
      );
      return null;
    }
  }
}

export default YieldCalculationService;
