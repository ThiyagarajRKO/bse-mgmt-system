"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * SKUGenerationService
 *
 * Generates deterministic SKU codes for production outputs:
 *
 * SKU Format: SPECIES-DERIVATIVE-GRADE-SIZE-PACK
 *
 * Example: POMFRET-FILLET-B-800GM-1KG
 *
 * Components:
 * - SPECIES: 3-letter species code (e.g., POM, VAN, SHR)
 * - DERIVATIVE: 3-5 letter code (e.g., FIL, WHO, MIN)
 * - GRADE: Single letter (A/B/C/D)
 * - SIZE: Size code from size_master (e.g., 800GM, 1KG)
 * - PACK: Packaging unit (e.g., 1KG, 5KG)
 *
 * HARD RULES:
 * - SKU is auto-generated per output line (not user-enterable)
 * - SKU is deterministic (same inputs always produce same SKU)
 * - SKU must be unique in product_master
 * - SKU becomes part of product master and used for invoicing
 * - No manual SKU creation or override allowed
 */

class SKUGenerationService {
  constructor(models, config = {}) {
    this.models = models;
    this.config = config;
    this.sequelize = models.sequelize;
  }

  /**
   * Generate deterministic SKU and create/link product_master record
   *
   * @param {Object} data - SKU generation data
   * @param {UUID} data.species_id - Species ID
   * @param {UUID} data.derivative_id - Derivative ID
   * @param {String} data.grade - Grade (A/B/C/D)
   * @param {String} data.size_code - Size code from size_master
   * @param {Number} data.pack_size_kg - Packaging size in kg (default 1)
   * @param {Object} data.additional_data - Optional: other product master fields
   *
   * @returns {Promise<Object>} { sku_code, product_id, product_master_record }
   *
   * @throws {Error} If species, derivative, or size invalid
   */
  async generateSKU(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Validate inputs
      const species = await this._validateSpecies(data.species_id, transaction);
      const derivative = await this._validateDerivative(
        data.derivative_id,
        transaction
      );
      const size = await this._validateSize(data.size_code, transaction);

      const packSize = data.pack_size_kg || 1;

      // Generate SKU code (deterministic)
      const skuCode = this._generateSKUCode(
        species.species_code ||
          species.species_name.substring(0, 3).toUpperCase(),
        derivative.derivative_code ||
          derivative.derivative_name.substring(0, 3).toUpperCase(),
        data.grade,
        data.size_code,
        packSize
      );

      // Check if this SKU already exists
      let product = await this.models.product_master.findOne({
        where: { sku_code: skuCode },
        transaction,
      });

      if (!product) {
        // Create new product_master record
        product = await this.models.product_master.create(
          {
            id: uuidv4(),
            sku_code: skuCode,
            product_name: `${species.species_name} - ${derivative.derivative_name} (${data.grade})`,
            species_id: data.species_id,
            derivative_id: data.derivative_id,
            grade: data.grade,
            size_code: data.size_code,
            pack_size_kg: packSize,
            hsn_code: derivative.hsn_code,
            is_active: true,
            ...(data.additional_data || {}),
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        sku_code: skuCode,
        product_id: product.id,
        product_master_record: product,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Generate SKU for a production output
   *
   * @param {Object} data - Output data
   * @param {UUID} data.production_order_id - Production order ID
   * @param {UUID} data.production_output_id - Production output ID (to update)
   * @param {UUID} data.species_id - Species ID
   * @param {UUID} data.derivative_id - Derivative ID
   * @param {String} data.grade - Grade (A/B/C/D)
   * @param {String} data.size_code - Size code
   * @param {UUID} data.updated_by - User generating SKU
   *
   * @returns {Promise<Object>} Updated production_outputs record with SKU
   */
  async generateAndLinkSKUForOutput(data) {
    const transaction = await this.sequelize.transaction();

    try {
      // Get production output
      const output = await this.models.production_outputs.findByPk(
        data.production_output_id,
        { transaction }
      );

      if (!output) {
        throw new Error(
          `Production output not found: ${data.production_output_id}`
        );
      }

      // Generate SKU
      const skuResult = await this.generateSKU({
        species_id: data.species_id,
        derivative_id: data.derivative_id,
        grade: data.grade,
        size_code: data.size_code,
        pack_size_kg: data.pack_size_kg || 1,
      });

      // Update production output with SKU and product reference
      await output.update(
        {
          product_id: skuResult.product_id,
          sku_code: skuResult.sku_code,
        },
        { transaction }
      );

      await transaction.commit();

      return await this.models.production_outputs.findByPk(
        data.production_output_id,
        {
          include: [
            {
              association: "sku_product",
              attributes: ["id", "sku_code", "product_name"],
            },
          ],
        }
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get or create SKU for existing product specification
   * Returns existing SKU if found, creates new if not
   *
   * @param {Object} spec - Product specification
   * @param {UUID} spec.species_id - Species ID
   * @param {UUID} spec.derivative_id - Derivative ID
   * @param {String} spec.grade - Grade
   * @param {String} spec.size_code - Size code
   * @param {Number} spec.pack_size_kg - Pack size
   *
   * @returns {Promise<String>} SKU code
   */
  async getOrCreateSKU(spec) {
    // Generate the SKU code
    const species = await this._validateSpecies(spec.species_id);
    const derivative = await this._validateDerivative(spec.derivative_id);

    const skuCode = this._generateSKUCode(
      species.species_code ||
        species.species_name.substring(0, 3).toUpperCase(),
      derivative.derivative_code ||
        derivative.derivative_name.substring(0, 3).toUpperCase(),
      spec.grade,
      spec.size_code,
      spec.pack_size_kg || 1
    );

    // Check if exists
    let product = await this.models.product_master.findOne({
      where: { sku_code: skuCode },
    });

    if (!product) {
      product = await this.models.product_master.create({
        id: uuidv4(),
        sku_code: skuCode,
        product_name: `${species.species_name} - ${derivative.derivative_name} (${spec.grade})`,
        species_id: spec.species_id,
        derivative_id: spec.derivative_id,
        grade: spec.grade,
        size_code: spec.size_code,
        pack_size_kg: spec.pack_size_kg || 1,
        hsn_code: derivative.hsn_code,
        is_active: true,
      });
    }

    return skuCode;
  }

  /**
   * Generate SKU code string (deterministic)
   *
   * @private
   * @param {String} speciesCode - Species code (3 letters)
   * @param {String} derivativeCode - Derivative code (3-5 letters)
   * @param {String} grade - Grade (A/B/C/D)
   * @param {String} sizeCode - Size code
   * @param {Number} packSize - Pack size
   *
   * @returns {String} SKU code
   */
  _generateSKUCode(speciesCode, derivativeCode, grade, sizeCode, packSize) {
    // Format: SPECIES-DERIVATIVE-GRADE-SIZE-PACK
    // Example: POM-FIL-B-800GM-1KG

    const specCode = String(speciesCode).substring(0, 4).toUpperCase();
    const derivCode = String(derivativeCode).substring(0, 5).toUpperCase();
    const gradeCode = String(grade).substring(0, 1).toUpperCase();
    const sizePartCode = String(sizeCode).substring(0, 10).toUpperCase();
    const packCode = `${packSize}KG`.toUpperCase();

    return `${specCode}-${derivCode}-${gradeCode}-${sizePartCode}-${packCode}`;
  }

  /**
   * Validate species exists
   *
   * @private
   * @param {UUID} speciesId - Species ID
   * @param {Object} transaction - Optional transaction
   * @returns {Promise<Object>} Species master record
   *
   * @throws {Error} If species not found
   */
  async _validateSpecies(speciesId, transaction) {
    const species = await this.models.species_master.findByPk(speciesId, {
      transaction,
    });

    if (!species) {
      throw new Error(`Species not found: ${speciesId}`);
    }

    return species;
  }

  /**
   * Validate derivative exists
   *
   * @private
   * @param {UUID} derivativeId - Derivative ID
   * @param {Object} transaction - Optional transaction
   * @returns {Promise<Object>} Derivative master record
   *
   * @throws {Error} If derivative not found
   */
  async _validateDerivative(derivativeId, transaction) {
    const derivative = await this.models.derivative_master.findByPk(
      derivativeId,
      { transaction }
    );

    if (!derivative) {
      throw new Error(`Derivative not found: ${derivativeId}`);
    }

    return derivative;
  }

  /**
   * Validate size code exists
   *
   * @private
   * @param {String} sizeCode - Size code
   * @param {Object} transaction - Optional transaction
   * @returns {Promise<Object>} Size master record
   *
   * @throws {Error} If size not found
   */
  async _validateSize(sizeCode, transaction) {
    const size = await this.models.size_master.findOne({
      where: { size_code: sizeCode },
      transaction,
    });

    if (!size) {
      throw new Error(`Size code not found: ${sizeCode}`);
    }

    return size;
  }

  /**
   * List all products (SKUs) for a production order
   *
   * @param {UUID} orderId - Production order ID
   * @returns {Promise<Array>} Products with SKU info
   */
  async getOrderSKUs(orderId) {
    const outputs = await this.models.production_outputs.findAll({
      where: { production_order_id: orderId },
      include: [
        {
          association: "sku_product",
          attributes: ["id", "sku_code", "product_name", "hsn_code"],
        },
      ],
      attributes: [
        "id",
        "sku_code",
        "actual_quantity_kg",
        "actual_grade",
        "size_code",
      ],
    });

    return outputs;
  }
}

module.exports = SKUGenerationService;
