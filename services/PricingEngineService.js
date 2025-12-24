const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const models = require("../models/index.js");

const {
  MarginMaster,
  ProcessingCostMaster,
  PriceSnapshot,
  ProcurementLots,
  SpeciesMaster,
  sequelize,
} = models;

class PricingEngineService {
  constructor() {
    this.marginCache = new Map(); // Cache for margin masters
    this.processingCostCache = new Map(); // Cache for processing costs
  }

  /**
   * Calculate yield-based price for a batch
   * @param {Object} batchData - Batch information
   * @param {Object} context - Context information (user, etc.)
   * @returns {Object} - Price calculation result
   */
  async calculateBatchPrice(batchData, context = {}) {
    const startTime = Date.now();

    try {
      // Validate input data
      this.validateBatchData(batchData);

      // Get batch details from database
      const batch = await ProcurementLots.findByPk(batchData.batchId, {
        include: [
          {
            model: SpeciesMaster,
            as: "species",
            required: true,
          },
        ],
      });

      if (!batch) {
        throw new Error(`Batch not found: ${batchData.batchId}`);
      }

      // Get margin configuration
      const marginConfig = await this.getMarginConfig(
        batch.species_id,
        batchData.productForm,
        batchData.market
      );

      if (!marginConfig) {
        throw new Error(
          `No margin configuration found for species ${batch.species_id}, form ${batchData.productForm}, market ${batchData.market}`
        );
      }

      // Get processing cost
      const processingCost = await this.getProcessingCost(
        batch.species_id,
        batchData.processType
      );

      // Calculate effective cost
      const effectiveCost = this.calculateEffectiveCost(
        batchData.rawCostPerKg,
        processingCost,
        batchData.yieldLossCostPerKg || 0,
        batchData.actualYieldPct
      );

      // Apply target margin
      const sellingPriceExGST = this.applyTargetMargin(
        effectiveCost,
        marginConfig.target_margin_pct
      );

      // Add GST
      const sellingPriceIncGST = this.addGST(
        sellingPriceExGST,
        batchData.gstRatePct
      );

      // Check yield penalty logic
      const yieldPenalty = this.checkYieldPenalty(
        batchData.expectedYieldPct,
        batchData.actualYieldPct,
        marginConfig
      );

      // Calculate final price with penalties/adjustments
      let finalPriceExGST = sellingPriceExGST;
      let finalPriceIncGST = sellingPriceIncGST;
      let requiresApproval = false;
      let penaltyReason = null;

      if (yieldPenalty.action === "AUTO_UPLIFT") {
        const upliftFactor = 1 + marginConfig.auto_uplift_pct / 100;
        finalPriceExGST *= upliftFactor;
        finalPriceIncGST = this.addGST(finalPriceExGST, batchData.gstRatePct);
        penaltyReason = `Auto-uplift applied due to yield variance of ${yieldPenalty.variancePct}%`;
      } else if (yieldPenalty.action === "APPROVAL_REQUIRED") {
        requiresApproval = true;
        penaltyReason = `Approval required due to yield variance of ${yieldPenalty.variancePct}%`;
      }

      // Check minimum margin
      const actualMarginPct = this.calculateMarginPct(
        effectiveCost,
        finalPriceExGST
      );
      const marginCheck = this.checkMinimumMargin(
        actualMarginPct,
        marginConfig.min_margin_pct
      );

      if (!marginCheck.passes) {
        requiresApproval = true;
        penaltyReason = `Margin ${actualMarginPct}% below minimum ${marginConfig.min_margin_pct}%`;
      }

      // Create price snapshot
      const priceSnapshot = await this.createPriceSnapshot(
        {
          batchId: batchData.batchId,
          speciesId: batch.species_id,
          productForm: batchData.productForm,
          market: batchData.market,
          rawCostPerKg: batchData.rawCostPerKg,
          processingCostPerKg: processingCost,
          yieldLossCostPerKg: batchData.yieldLossCostPerKg || 0,
          expectedYieldPct: batchData.expectedYieldPct,
          actualYieldPct: batchData.actualYieldPct,
          yieldVariancePct: yieldPenalty.variancePct,
          effectiveCostPerKg: effectiveCost,
          targetMarginPct: marginConfig.target_margin_pct,
          calculatedPriceExGST: finalPriceExGST,
          gstRatePct: batchData.gstRatePct,
          calculatedPriceIncGST: finalPriceIncGST,
          status: requiresApproval ? "CALCULATED" : "APPROVED",
          calculationMetadata: {
            processingTimeMs: Date.now() - startTime,
            yieldPenalty,
            marginCheck,
            marginConfig: marginConfig.id,
            processingCostConfig: processingCost ? "configured" : "default",
          },
        },
        context
      );

      return {
        success: true,
        priceSnapshot,
        calculation: {
          effectiveCostPerKg: effectiveCost,
          targetMarginPct: marginConfig.target_margin_pct,
          calculatedPriceExGST: finalPriceExGST,
          gstRatePct: batchData.gstRatePct,
          calculatedPriceIncGST: finalPriceIncGST,
          actualMarginPct,
          yieldPenalty,
          marginCheck,
          requiresApproval,
          penaltyReason,
        },
        message: requiresApproval
          ? "Price calculated but requires approval due to yield variance or margin constraints"
          : "Price calculated successfully",
      };
    } catch (error) {
      console.error("Error calculating batch price:", error);
      throw error;
    }
  }

  /**
   * Validate batch data for price calculation
   * @param {Object} batchData - Batch data to validate
   */
  validateBatchData(batchData) {
    const required = [
      "batchId",
      "productForm",
      "market",
      "processType",
      "rawCostPerKg",
      "expectedYieldPct",
      "actualYieldPct",
      "gstRatePct",
    ];

    for (const field of required) {
      if (!batchData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (batchData.rawCostPerKg <= 0) {
      throw new Error("Raw cost per kg must be positive");
    }

    if (batchData.actualYieldPct <= 0 || batchData.actualYieldPct > 100) {
      throw new Error("Actual yield percentage must be between 0 and 100");
    }

    if (batchData.expectedYieldPct <= 0 || batchData.expectedYieldPct > 100) {
      throw new Error("Expected yield percentage must be between 0 and 100");
    }

    if (batchData.gstRatePct < 0 || batchData.gstRatePct > 100) {
      throw new Error("GST rate percentage must be between 0 and 100");
    }
  }

  /**
   * Get margin configuration for species, product form, and market
   * @param {string} speciesId - Species ID
   * @param {string} productForm - Product form (FROZEN, COOKED, etc.)
   * @param {string} market - Market (DOMESTIC, EXPORT, etc.)
   * @returns {Object} - Margin configuration
   */
  async getMarginConfig(speciesId, productForm, market) {
    const cacheKey = `${speciesId}-${productForm}-${market}`;

    if (this.marginCache.has(cacheKey)) {
      return this.marginCache.get(cacheKey);
    }

    const marginConfig = await MarginMaster.findOne({
      where: {
        species_id: speciesId,
        product_form: productForm,
        market: market,
        is_active: true,
        [Op.or]: [
          { effective_from: null },
          { effective_from: { [Op.lte]: new Date() } },
        ],
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: new Date() } },
        ],
      },
      order: [["created_at", "DESC"]],
    });

    if (marginConfig) {
      this.marginCache.set(cacheKey, marginConfig);
    }

    return marginConfig;
  }

  /**
   * Get processing cost for species and process type
   * @param {string} speciesId - Species ID
   * @param {string} processType - Process type
   * @returns {number} - Processing cost per kg
   */
  async getProcessingCost(speciesId, processType) {
    const cacheKey = `${speciesId}-${processType}`;

    if (this.processingCostCache.has(cacheKey)) {
      return this.processingCostCache.get(cacheKey);
    }

    const processingCost = await ProcessingCostMaster.findOne({
      where: {
        species_id: speciesId,
        process_type: processType,
        is_active: true,
        [Op.or]: [
          { effective_from: null },
          { effective_from: { [Op.lte]: new Date() } },
        ],
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: new Date() } },
        ],
      },
      order: [["created_at", "DESC"]],
    });

    const cost = processingCost ? processingCost.cost_per_kg : 0;
    this.processingCostCache.set(cacheKey, cost);

    return cost;
  }

  /**
   * Calculate effective cost per kg
   * Formula: (Raw Cost + Processing Cost + Yield Loss Cost) / Saleable Output %
   * @param {number} rawCost - Raw cost per kg
   * @param {number} processingCost - Processing cost per kg
   * @param {number} yieldLossCost - Yield loss cost per kg
   * @param {number} actualYieldPct - Actual yield percentage
   * @returns {number} - Effective cost per kg
   */
  calculateEffectiveCost(
    rawCost,
    processingCost,
    yieldLossCost,
    actualYieldPct
  ) {
    const totalCostPerKg = rawCost + processingCost + yieldLossCost;
    const saleableOutputPct = actualYieldPct / 100;

    if (saleableOutputPct <= 0) {
      throw new Error(
        "Invalid yield percentage: cannot calculate effective cost"
      );
    }

    return totalCostPerKg / saleableOutputPct;
  }

  /**
   * Apply target margin to effective cost
   * Formula: Effective Cost / (1 - Target Margin %)
   * @param {number} effectiveCost - Effective cost per kg
   * @param {number} targetMarginPct - Target margin percentage
   * @returns {number} - Selling price ex-GST
   */
  applyTargetMargin(effectiveCost, targetMarginPct) {
    const marginFactor = 1 - targetMarginPct / 100;

    if (marginFactor <= 0) {
      throw new Error(
        "Invalid target margin percentage: would result in infinite price"
      );
    }

    return effectiveCost / marginFactor;
  }

  /**
   * Add GST to selling price
   * @param {number} priceExGST - Price excluding GST
   * @param {number} gstRatePct - GST rate percentage
   * @returns {number} - Price including GST
   */
  addGST(priceExGST, gstRatePct) {
    const gstAmount = priceExGST * (gstRatePct / 100);
    return priceExGST + gstAmount;
  }

  /**
   * Check yield penalty logic
   * @param {number} expectedYield - Expected yield percentage
   * @param {number} actualYield - Actual yield percentage
   * @param {Object} marginConfig - Margin configuration
   * @returns {Object} - Yield penalty result
   */
  checkYieldPenalty(expectedYield, actualYield, marginConfig) {
    const variancePct = ((expectedYield - actualYield) / expectedYield) * 100;

    let action = "ABSORB";
    if (Math.abs(variancePct) > marginConfig.approval_required_pct) {
      action = "APPROVAL_REQUIRED";
    } else if (Math.abs(variancePct) > marginConfig.yield_tolerance_pct) {
      action = "AUTO_UPLIFT";
    }

    return {
      variancePct: variancePct.toFixed(2),
      action,
      tolerancePct: marginConfig.yield_tolerance_pct,
      autoUpliftPct: marginConfig.auto_uplift_pct,
      approvalRequiredPct: marginConfig.approval_required_pct,
    };
  }

  /**
   * Calculate actual margin percentage
   * @param {number} cost - Cost per kg
   * @param {number} price - Selling price per kg
   * @returns {number} - Margin percentage
   */
  calculateMarginPct(cost, price) {
    if (cost <= 0) return 0;
    return ((price - cost) / cost) * 100;
  }

  /**
   * Check minimum margin constraint
   * @param {number} actualMargin - Actual margin percentage
   * @param {number} minMargin - Minimum margin percentage
   * @returns {Object} - Margin check result
   */
  checkMinimumMargin(actualMargin, minMargin) {
    return {
      passes: actualMargin >= minMargin,
      actualMargin: actualMargin.toFixed(2),
      minMargin: minMargin.toFixed(2),
      shortfall: Math.max(0, minMargin - actualMargin).toFixed(2),
    };
  }

  /**
   * Create price snapshot record
   * @param {Object} priceData - Price calculation data
   * @param {Object} context - Context information
   * @returns {Object} - Created price snapshot
   */
  async createPriceSnapshot(priceData, context = {}) {
    const snapshot = await PriceSnapshot.create({
      ...priceData,
      id: uuidv4(),
      created_by: context.userId,
      updated_by: context.userId,
    });

    return snapshot;
  }

  /**
   * Apply price override with approval
   * @param {string} snapshotId - Price snapshot ID
   * @param {Object} overrideData - Override information
   * @param {Object} context - Context information
   * @returns {Object} - Override result
   */
  async applyPriceOverride(snapshotId, overrideData, context = {}) {
    const transaction = await sequelize.transaction();

    try {
      const snapshot = await PriceSnapshot.findByPk(snapshotId, {
        transaction,
      });
      if (!snapshot) {
        throw new Error("Price snapshot not found");
      }

      if (snapshot.status === "EXPIRED") {
        throw new Error("Cannot override expired price snapshot");
      }

      // Update snapshot with override
      await snapshot.update(
        {
          is_override: true,
          override_reason: overrideData.reason,
          override_price: overrideData.price,
          override_approved_by: context.userId,
          override_approved_at: new Date(),
          status: "APPROVED",
          updated_by: context.userId,
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        snapshot,
        message: "Price override applied successfully",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Approve or reject price snapshot
   * @param {string} snapshotId - Price snapshot ID
   * @param {string} action - 'APPROVE' or 'REJECT'
   * @param {Object} context - Context information
   * @param {string} reason - Rejection reason (if rejecting)
   * @returns {Object} - Approval result
   */
  async approveOrRejectPrice(snapshotId, action, context = {}, reason = null) {
    const transaction = await sequelize.transaction();

    try {
      const snapshot = await PriceSnapshot.findByPk(snapshotId, {
        transaction,
      });
      if (!snapshot) {
        throw new Error("Price snapshot not found");
      }

      if (action === "APPROVE") {
        await snapshot.update(
          {
            status: "APPROVED",
            approved_by: context.userId,
            approved_at: new Date(),
            updated_by: context.userId,
          },
          { transaction }
        );
      } else if (action === "REJECT") {
        if (!reason) {
          throw new Error("Rejection reason is required");
        }

        await snapshot.update(
          {
            status: "REJECTED",
            rejected_by: context.userId,
            rejected_at: new Date(),
            rejection_reason: reason,
            updated_by: context.userId,
          },
          { transaction }
        );
      } else {
        throw new Error("Invalid action. Must be APPROVE or REJECT");
      }

      await transaction.commit();

      return {
        success: true,
        snapshot,
        message: `Price ${action.toLowerCase()}d successfully`,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get pricing history for a batch
   * @param {string} batchId - Batch ID
   * @returns {Array} - Price snapshots for the batch
   */
  async getBatchPricingHistory(batchId) {
    const snapshots = await PriceSnapshot.findAll({
      where: { batch_id: batchId },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: SpeciesMaster,
          as: "species",
          attributes: ["species_name"],
        },
      ],
    });

    return snapshots;
  }

  /**
   * Clear caches (useful for testing or when configurations change)
   */
  clearCaches() {
    this.marginCache.clear();
    this.processingCostCache.clear();
  }
}

module.exports = PricingEngineService;
