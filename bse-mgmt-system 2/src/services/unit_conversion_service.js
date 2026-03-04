/**
 * Unit Conversion Service
 * Handles conversions between count-based and weight-based measurements
 * Uses derivative unit standards for accurate conversions
 */

import models from "../../models";

export class UnitConversionService {
  /**
   * Convert count-based quantity to weight-based quantity
   * @param {Object} params - { derivativeId, count, unitType }
   * @returns {Object} - { weightKg, conversionFactor, unitStandard }
   */
  static async convertCountToWeight(params) {
    try {
      const { derivativeId, count, unitType = "COUNT" } = params;

      if (unitType !== "COUNT") {
        throw new Error("This method only handles COUNT to weight conversions");
      }

      // Fetch unit standard for this derivative
      const unitStandard = await models.DerivativeUnitStandard.findOne({
        where: {
          derivative_id: derivativeId,
          unit_type: "COUNT",
          is_active: true,
        },
        attributes: [
          "id",
          "derivative_id",
          "unit_type",
          "avg_unit_weight_g",
          "unit_name",
          "conversion_factor",
          "is_active",
        ],
        raw: true,
      });

      if (!unitStandard) {
        throw new Error(
          `No unit standard found for derivative ${derivativeId} with COUNT units`,
        );
      }

      // Convert count to weight in grams, then to kg
      const totalWeightG = count * unitStandard.avg_unit_weight_g;
      const weightKg = totalWeightG / 1000;

      return {
        success: true,
        data: {
          originalCount: count,
          weightKg: weightKg,
          totalWeightG: totalWeightG,
          avgUnitWeightG: unitStandard.avg_unit_weight_g,
          conversionFactor:
            unitStandard.conversion_factor ||
            unitStandard.avg_unit_weight_g / 1000,
          unitStandardId: unitStandard.id,
          unitName: unitStandard.unit_name,
          derivativeId: derivativeId,
        },
      };
    } catch (error) {
      console.error("Error in convertCountToWeight:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert weight-based quantity to estimated count
   * @param {Object} params - { derivativeId, weightKg }
   * @returns {Object} - { estimatedCount, conversionFactor, unitStandard }
   */
  static async convertWeightToCount(params) {
    try {
      const { derivativeId, weightKg } = params;

      // Fetch unit standard for this derivative
      const unitStandard = await models.DerivativeUnitStandard.findOne({
        where: {
          derivative_id: derivativeId,
          unit_type: "COUNT",
          is_active: true,
        },
        attributes: [
          "id",
          "derivative_id",
          "unit_type",
          "avg_unit_weight_g",
          "unit_name",
          "conversion_factor",
          "is_active",
        ],
        raw: true,
      });

      if (!unitStandard) {
        throw new Error(
          `No unit standard found for derivative ${derivativeId} with COUNT units`,
        );
      }

      // Convert weight to grams, then estimate count
      const totalWeightG = weightKg * 1000;
      const estimatedCount = Math.round(
        totalWeightG / unitStandard.avg_unit_weight_g,
      );

      return {
        success: true,
        data: {
          originalWeightKg: weightKg,
          estimatedCount: estimatedCount,
          totalWeightG: totalWeightG,
          avgUnitWeightG: unitStandard.avg_unit_weight_g,
          conversionFactor:
            unitStandard.conversion_factor ||
            unitStandard.avg_unit_weight_g / 1000,
          unitStandardId: unitStandard.id,
          unitName: unitStandard.unit_name,
          derivativeId: derivativeId,
        },
      };
    } catch (error) {
      console.error("Error in convertWeightToCount:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get unit standard for a derivative
   * @param {Object} params - { derivativeId, unitType }
   * @returns {Object} - { unitStandard }
   */
  static async getUnitStandard(params) {
    try {
      const { derivativeId, unitType } = params;

      const unitStandard = await models.DerivativeUnitStandard.findOne({
        where: {
          derivative_id: derivativeId,
          unit_type: unitType,
          is_active: true,
        },
        attributes: [
          "id",
          "derivative_id",
          "unit_type",
          "avg_unit_weight_g",
          "unit_name",
          "conversion_factor",
          "min_unit_weight_g",
          "max_unit_weight_g",
          "is_active",
          "created_at",
          "updated_at",
        ],
        raw: true,
      });

      if (!unitStandard) {
        return {
          success: false,
          error: `No unit standard found for derivative ${derivativeId} with ${unitType} units`,
        };
      }

      return {
        success: true,
        data: unitStandard,
      };
    } catch (error) {
      console.error("Error in getUnitStandard:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate unit conversion parameters
   * @param {Object} params - { derivativeId, quantity, unitType }
   * @returns {Object} - { isValid, convertedQuantity, unitStandard }
   */
  static async validateAndConvert(params) {
    try {
      const { derivativeId, quantity, unitType } = params;

      // Get unit standard
      const unitStandardResult = await this.getUnitStandard({
        derivativeId,
        unitType,
      });

      if (!unitStandardResult.success) {
        return unitStandardResult;
      }

      const unitStandard = unitStandardResult.data;

      // Perform conversion based on unit type
      let convertedQuantity;
      let conversionType;

      if (unitType === "COUNT") {
        // Convert count to weight
        const conversionResult = await this.convertCountToWeight({
          derivativeId,
          count: quantity,
        });
        if (!conversionResult.success) {
          return conversionResult;
        }
        convertedQuantity = conversionResult.data.weightKg;
        conversionType = "COUNT_TO_WEIGHT";
      } else if (unitType === "KG") {
        // Already in weight, just validate
        convertedQuantity = quantity;
        conversionType = "NO_CONVERSION";
      } else {
        return {
          success: false,
          error: `Unsupported unit type: ${unitType}`,
        };
      }

      return {
        success: true,
        data: {
          originalQuantity: quantity,
          originalUnitType: unitType,
          convertedQuantity: convertedQuantity,
          convertedUnitType: "KG",
          conversionType: conversionType,
          unitStandard: unitStandard,
        },
      };
    } catch (error) {
      console.error("Error in validateAndConvert:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default UnitConversionService;
