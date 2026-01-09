"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * DerivativeAllocationService
 *
 * Manages derivative selection and percentage allocation:
 * 1. Validate derivative allowed for species-grade combination
 * 2. Validate percentages sum to 100%
 * 3. Lookup theoretical yield from YieldMaster
 * 4. Calculate expected output quantities
 * 5. Auto-enable MINCE for trim loss on high yields
 *
 * HARD RULES:
 * - Percentages must sum to exactly 100% (cannot be 99.5% or 100.5%)
 * - Derivative must be allowed for the species
 * - Derivative must be allowed for the grade
 * - Theoretical yield comes from YieldMaster (not user-editable)
 * - One entry per derivative per order (unique constraint)
 * - MINCE can be auto-enabled for trim loss (is_auto_enabled = true)
 */

class DerivativeAllocationService {
  constructor(
    models,
    derivativeGradeRulesService,
    productionYieldService,
    config = {}
  ) {
    this.models = models;
    this.derivativeGradeRulesService = derivativeGradeRulesService;
    this.productionYieldService = productionYieldService;
    this.config = config;
    this.sequelize = models.sequelize;
  }

  /**
   * Allocate derivatives to a production order
   *
   * @param {Object} data - Allocation data
   * @param {UUID} data.production_order_id - Production order ID
   * @param {Array} data.derivatives - Array of derivative allocations
   * @param {UUID} data.derivatives[].derivative_id - Derivative ID
   * @param {Number} data.derivatives[].planned_percentage - Allocation percentage
   * @param {UUID} data.user_id - User making allocation
   *
   * Derivative object:
   * {
   *   derivative_id: "uuid",
   *   planned_percentage: 75.5   // Must sum to 100 across all entries
   * }
   *
   * @returns {Promise<Array>} Created production_derivatives records
   *
   * @throws {Error} If validation fails, percentages invalid, or derivative not allowed
   */
  async allocateDerivatives(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate production order and get raw issue data
      const order = await this._validateOrder(
        data.production_order_id,
        transaction
      );
      const rawIssue = await this._validateRawIssue(
        data.production_order_id,
        transaction
      );

      if (!rawIssue) {
        throw new Error(
          "Raw material must be issued before allocating derivatives"
        );
      }

      // Validate percentages sum to 100
      this._validatePercentageSum(data.derivatives);

      // Validate each derivative
      const derivativeList = [];
      for (const derivData of data.derivatives) {
        const derivative = await this._validateDerivativeAllowed(
          derivData.derivative_id,
          order.input_species_id,
          rawIssue.initial_grade,
          transaction
        );

        // Lookup theoretical yield from YieldMaster
        const yieldRecord = await this._getTheoreticalYield(
          order.input_species_id,
          derivData.derivative_id,
          rawIssue.initial_grade,
          transaction
        );

        if (!yieldRecord) {
          throw new Error(
            `No yield data found for species-derivative-grade combination: ${order.input_species_id}-${derivData.derivative_id}-${rawIssue.initial_grade}`
          );
        }

        // Calculate expected quantity
        const expectedQty =
          ((rawIssue.issued_quantity_kg * derivData.planned_percentage) / 100) *
          (yieldRecord.yield_percent / 100);

        derivativeList.push({
          derivative_id: derivData.derivative_id,
          planned_percentage: derivData.planned_percentage,
          theoretical_yield_percent: yieldRecord.yield_percent,
          expected_quantity_kg: expectedQty,
          derivative_name: derivative.derivative_name,
        });
      }

      // Check for trim loss and auto-enable MINCE if needed
      const totalExpected = derivativeList.reduce(
        (sum, d) => sum + d.expected_quantity_kg,
        0
      );
      const totalIssued = rawIssue.issued_quantity_kg;
      const trimLoss = totalIssued - totalExpected;
      const trimLossPercent = (trimLoss / totalIssued) * 100;

      // Auto-enable MINCE if trim loss > 5%
      let hasAutoMinc = derivativeList.some(
        (d) => d.derivative_name === "MINCE"
      );
      if (!hasAutoMinc && trimLossPercent > 5) {
        // Create auto-enabled MINCE entry
        const minceDerivative = await this._getOrCreateMince(transaction);
        const minceYield = await this._getTheoreticalYield(
          order.input_species_id,
          minceDerivative.id,
          rawIssue.initial_grade,
          transaction
        );

        if (minceYield) {
          derivativeList.push({
            derivative_id: minceDerivative.id,
            planned_percentage: 0, // Absorbs trim loss
            theoretical_yield_percent: minceYield.yield_percent,
            expected_quantity_kg: trimLoss,
            is_auto_enabled: true,
            derivative_name: "MINCE",
          });
        }
      }

      // Delete any existing derivatives for this order
      await this.models.production_derivatives.destroy({
        where: { production_order_id: data.production_order_id },
        transaction,
      });

      // Create production_derivatives records
      const createdDerivatives = [];
      for (const derivData of derivativeList) {
        const prodDeriv = await this.models.production_derivatives.create(
          {
            id: uuidv4(),
            production_order_id: data.production_order_id,
            derivative_id: derivData.derivative_id,
            planned_percentage: derivData.planned_percentage,
            theoretical_yield_percent: derivData.theoretical_yield_percent,
            expected_quantity_kg: derivData.expected_quantity_kg,
            is_auto_enabled: derivData.is_auto_enabled || false,
          },
          { transaction }
        );

        createdDerivatives.push(prodDeriv);
      }

      await transaction.commit();

      // Return with derivatives and names
      return await this.getDerivativesByOrderId(data.production_order_id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get derivatives for a production order
   *
   * @param {UUID} orderId - Production order ID
   * @returns {Promise<Array>} Production derivatives with derivative details
   */
  async getDerivativesByOrderId(orderId) {
    const derivatives = await this.models.production_derivatives.findAll({
      where: { production_order_id: orderId },
      include: [
        {
          association: "derivative",
          attributes: ["id", "derivative_name", "hsn_code"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return derivatives;
  }

  /**
   * Validate production order exists and is in correct state
   *
   * @private
   * @param {UUID} orderId - Order ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Order
   *
   * @throws {Error} If order invalid or not in RAW_ISSUED status
   */
  async _validateOrder(orderId, transaction) {
    const order = await this.models.production_orders.findByPk(orderId, {
      transaction,
    });

    if (!order) {
      throw new Error(`Production order not found: ${orderId}`);
    }

    if (order.status !== "RAW_ISSUED") {
      throw new Error(
        `Order must be in RAW_ISSUED status to allocate derivatives. Current status: ${order.status}`
      );
    }

    return order;
  }

  /**
   * Validate raw issue exists for order
   *
   * @private
   * @param {UUID} orderId - Order ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Raw issue or null
   */
  async _validateRawIssue(orderId, transaction) {
    return await this.models.production_raw_issues.findOne({
      where: { production_order_id: orderId },
      transaction,
    });
  }

  /**
   * Validate derivative is allowed for species-grade
   *
   * @private
   * @param {UUID} derivativeId - Derivative ID
   * @param {UUID} speciesId - Species ID
   * @param {String} grade - Grade (A/B/C/D)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Derivative master record
   *
   * @throws {Error} If derivative not allowed
   */
  async _validateDerivativeAllowed(
    derivativeId,
    speciesId,
    grade,
    transaction
  ) {
    const derivative = await this.models.derivative_master.findByPk(
      derivativeId,
      { transaction }
    );

    if (!derivative) {
      throw new Error(`Derivative not found: ${derivativeId}`);
    }

    // Check business rule: is this derivative allowed for this species-grade?
    if (this.derivativeGradeRulesService) {
      const allowed =
        await this.derivativeGradeRulesService.isDerivativeAllowed(
          speciesId,
          derivativeId,
          grade,
          { transaction }
        );

      if (!allowed) {
        throw new Error(
          `Derivative ${derivative.derivative_name} is not allowed for species ${speciesId}, grade ${grade}`
        );
      }
    }

    return derivative;
  }

  /**
   * Get theoretical yield from YieldMaster
   *
   * @private
   * @param {UUID} speciesId - Species ID
   * @param {UUID} derivativeId - Derivative ID
   * @param {String} grade - Grade (A/B/C/D)
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object|null>} Yield record { yield_percent } or null
   */
  async _getTheoreticalYield(speciesId, derivativeId, grade, transaction) {
    if (this.productionYieldService) {
      return await this.productionYieldService.getYield(
        speciesId,
        derivativeId,
        grade,
        { transaction }
      );
    }

    // Fallback to direct query
    const yieldRecord = await this.models.derivative_yield_master.findOne({
      where: {
        species_id: speciesId,
        derivative_id: derivativeId,
        grade: grade,
      },
      attributes: ["yield_percent"],
      transaction,
    });

    return yieldRecord;
  }

  /**
   * Get or create MINCE derivative
   *
   * @private
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} MINCE derivative record
   */
  async _getOrCreateMince(transaction) {
    let mince = await this.models.derivative_master.findOne({
      where: { derivative_name: "MINCE" },
      transaction,
    });

    if (!mince) {
      mince = await this.models.derivative_master.create(
        {
          id: uuidv4(),
          derivative_name: "MINCE",
          is_edible: true,
          hsn_code: "0302.00.00",
        },
        { transaction }
      );
    }

    return mince;
  }

  /**
   * Validate that percentages sum to 100
   *
   * @private
   * @param {Array} derivatives - Derivative array
   *
   * @throws {Error} If sum not exactly 100
   */
  _validatePercentageSum(derivatives) {
    // Filter out auto-enabled derivatives from calculation
    const manualDerivs = derivatives.filter((d) => !d.is_auto_enabled);

    if (manualDerivs.length === 0) {
      throw new Error("At least one manually allocated derivative is required");
    }

    const sum = manualDerivs.reduce(
      (total, d) => total + parseFloat(d.planned_percentage || 0),
      0
    );
    const tolerance = 0.01; // Allow 0.01% rounding difference

    if (Math.abs(sum - 100) > tolerance) {
      throw new Error(
        `Derivative percentages must sum to 100%. Current sum: ${sum.toFixed(
          2
        )}%`
      );
    }
  }
}

module.exports = DerivativeAllocationService;
