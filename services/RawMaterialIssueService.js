"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * RawMaterialIssueService
 *
 * Manages raw material issuance to production orders:
 * 1. Validate inventory lots (not expired, passed QC)
 * 2. Capture and lock size/grade (immutable after issuance)
 * 3. Create production_raw_issues record
 * 4. Lock grade + size in grade_size_validation_log
 *
 * HARD RULES:
 * - Cannot issue expired lots (is_expired = false)
 * - Cannot issue QC-failed lots (is_qc_failed = false)
 * - Size and grade become IMMUTABLE after issuance
 * - One and only one raw issue per production order
 * - Size must map to valid size_master entry
 */

class RawMaterialIssueService {
  constructor(models, config = {}) {
    this.models = models;
    this.config = config;
    this.sequelize = models.sequelize;
  }

  /**
   * Issue raw material to a production order
   *
   * @param {Object} data - Issue data
   * @param {UUID} data.production_order_id - Production order ID
   * @param {UUID} data.inventory_lot_id - Inventory lot ID
   * @param {Number} data.issued_quantity_kg - Quantity being issued
   * @param {Number} data.measured_avg_size_kg - Average size measured at issuance
   * @param {String} data.size_code - Size code from size_master
   * @param {String} data.initial_grade - Grade at issuance (A/B/C/D)
   * @param {UUID} data.issued_by - User issuing material
   * @param {String} data.remarks - Optional remarks
   *
   * @returns {Promise<Object>} Created production_raw_issues record
   *
   * @throws {Error} If lot invalid, expired, QC-failed, or validation fails
   */
  async issueRawMaterial(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate production order exists and is in PLANNED status
      const order = await this._validateProductionOrder(
        data.production_order_id,
        transaction
      );

      // Check no prior issue exists for this order
      const existingIssue = await this.models.production_raw_issues.findOne({
        where: { production_order_id: data.production_order_id },
        transaction,
      });

      if (existingIssue) {
        throw new Error(
          "Production order already has a raw material issue. Cannot issue twice."
        );
      }

      // Validate inventory lot exists and is available
      const lot = await this._validateInventoryLot(
        data.inventory_lot_id,
        transaction
      );

      // HARD BLOCK: Expired lots
      if (data.is_expired) {
        throw new Error("HARD BLOCK: Cannot issue expired raw material lot");
      }

      // HARD BLOCK: QC-failed lots
      if (data.is_qc_failed) {
        throw new Error("HARD BLOCK: Cannot issue QC-failed raw material lot");
      }

      // Validate size code exists in size_master
      const sizeMapping = await this._validateSizeMapping(
        data.size_code,
        transaction
      );

      // Validate grade value
      if (!["A", "B", "C", "D"].includes(data.initial_grade)) {
        throw new Error(
          `Invalid grade: ${data.initial_grade}. Must be A, B, C, or D.`
        );
      }

      // Validate issued quantity doesn't exceed available inventory
      if (data.issued_quantity_kg > lot.available_quantity_kg) {
        throw new Error(
          `Insufficient inventory. Requested: ${data.issued_quantity_kg}kg, Available: ${lot.available_quantity_kg}kg`
        );
      }

      // Create raw issue record (size and grade IMMUTABLE)
      const rawIssue = await this.models.production_raw_issues.create(
        {
          id: uuidv4(),
          production_order_id: data.production_order_id,
          inventory_lot_id: data.inventory_lot_id,
          issued_quantity_kg: data.issued_quantity_kg,
          measured_avg_size_kg: data.measured_avg_size_kg,
          size_code: data.size_code,
          initial_grade: data.initial_grade,
          grade_locked: true, // IMMUTABLE
          size_locked: true, // IMMUTABLE
          is_expired: data.is_expired || false,
          is_qc_failed: data.is_qc_failed || false,
          issued_by: data.issued_by,
          issued_at: new Date(),
          remarks: data.remarks || null,
        },
        { transaction }
      );

      // Create immutable grade-size validation log
      await this._createValidationLog(
        data.production_order_id,
        order.input_species_id,
        null, // derivative_id will be null at issue time
        data.measured_avg_size_kg,
        data.size_code,
        data.initial_grade,
        "VALID",
        "Raw material issued and locked",
        data.issued_by,
        transaction
      );

      // Update order status to RAW_ISSUED and capture quantity
      await order.update(
        {
          status: "RAW_ISSUED",
          issued_quantity_kg: data.issued_quantity_kg,
        },
        { transaction }
      );

      // Decrease available inventory in inventory_master
      await lot.update(
        {
          available_quantity_kg:
            lot.available_quantity_kg - data.issued_quantity_kg,
        },
        { transaction }
      );

      await transaction.commit();

      // Return with full relationships
      return await this.getRawIssueById(rawIssue.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get raw issue by ID with relationships
   *
   * @param {UUID} issueId - Raw issue ID
   * @returns {Promise<Object>} Raw issue with relationships
   */
  async getRawIssueById(issueId) {
    const issue = await this.models.production_raw_issues.findByPk(issueId, {
      include: [
        {
          association: "production_order",
          attributes: ["id", "order_number", "status", "planned_quantity_kg"],
        },
        {
          association: "inventory_lot",
          attributes: [
            "id",
            "lot_number",
            "species_id",
            "available_quantity_kg",
          ],
        },
      ],
    });

    if (!issue) {
      throw new Error(`Raw issue not found: ${issueId}`);
    }

    return issue;
  }

  /**
   * Get raw issue by production order ID
   *
   * @param {UUID} orderId - Production order ID
   * @returns {Promise<Object|null>} Raw issue or null
   */
  async getByProductionOrderId(orderId) {
    return await this.models.production_raw_issues.findOne({
      where: { production_order_id: orderId },
      include: [
        {
          association: "production_order",
          attributes: ["id", "order_number", "input_species_id"],
        },
      ],
    });
  }

  /**
   * Validate production order exists and is in correct state
   *
   * @private
   * @param {UUID} orderId - Order ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Order object
   *
   * @throws {Error} If order invalid or not in PLANNED status
   */
  async _validateProductionOrder(orderId, transaction) {
    const order = await this.models.production_orders.findByPk(orderId, {
      transaction,
    });

    if (!order) {
      throw new Error(`Production order not found: ${orderId}`);
    }

    if (order.status !== "PLANNED") {
      throw new Error(
        `Order must be in PLANNED status to issue raw material. Current status: ${order.status}`
      );
    }

    return order;
  }

  /**
   * Validate inventory lot exists and is available
   *
   * @private
   * @param {UUID} lotId - Inventory lot ID
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Lot object
   *
   * @throws {Error} If lot invalid or insufficient quantity
   */
  async _validateInventoryLot(lotId, transaction) {
    const lot = await this.models.inventory_master.findByPk(lotId, {
      transaction,
    });

    if (!lot) {
      throw new Error(`Inventory lot not found: ${lotId}`);
    }

    if (lot.available_quantity_kg <= 0) {
      throw new Error(`Lot has no available inventory: ${lot.lot_number}`);
    }

    return lot;
  }

  /**
   * Validate size code exists in size_master
   *
   * @private
   * @param {String} sizeCode - Size code
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>} Size master record
   *
   * @throws {Error} If size code invalid
   */
  async _validateSizeMapping(sizeCode, transaction) {
    const size = await this.models.size_master.findOne({
      where: { size_code: sizeCode },
      transaction,
    });

    if (!size) {
      throw new Error(`Size code not found in size_master: ${sizeCode}`);
    }

    return size;
  }

  /**
   * Create immutable grade-size validation log entry
   *
   * @private
   * @param {UUID} orderId - Production order ID
   * @param {UUID} speciesId - Species ID
   * @param {UUID} derivativeId - Derivative ID (null for raw issue)
   * @param {Number} measuredSize - Measured size in kg
   * @param {String} sizeCode - Mapped size code
   * @param {String} declaredGrade - Declared grade
   * @param {String} validationStatus - VALID/INVALID/BLOCKED
   * @param {String} reason - Validation reason
   * @param {UUID} userId - User performing validation
   * @param {Object} transaction - Sequelize transaction
   *
   * @returns {Promise<Object>} Created validation log
   */
  async _createValidationLog(
    orderId,
    speciesId,
    derivativeId,
    measuredSize,
    sizeCode,
    declaredGrade,
    validationStatus,
    reason,
    userId,
    transaction
  ) {
    return await this.models.grade_size_validation_logs.create(
      {
        id: uuidv4(),
        production_order_id: orderId,
        species_id: speciesId,
        derivative_id: derivativeId,
        measured_size_kg: measuredSize,
        mapped_size_code: sizeCode,
        declared_grade: declaredGrade,
        validation_status: validationStatus,
        validation_reason: reason,
        size_locked_at: new Date(),
        grade_locked_at: new Date(),
        validated_by: userId,
      },
      { transaction }
    );
  }
}

module.exports = RawMaterialIssueService;
