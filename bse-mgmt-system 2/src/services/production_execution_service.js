/**
 * Production Execution Service
 * Handles production execution tracking with yield enforcement
 * Implements PASS/HOLD/FAIL status validation based on yield standards
 */

import models from "../../models";
import { Op } from "sequelize";

export class ProductionExecutionService {
  /**
   * Record production execution with yield validation
   * @param {Object} params - { productionOrderId, actualOutputKg, expectedYieldKg, speciesId, derivativeId, processingType, operatorId }
   * @returns {Object} - { executionId, status, yieldVariance, validationResult }
   */
  static async recordProductionExecution(params) {
    try {
      const {
        productionOrderId,
        actualOutputKg,
        expectedYieldKg,
        speciesId,
        derivativeId,
        processingType,
        operatorId,
        notes,
      } = params;

      // Calculate actual yield percentage
      const actualYieldPct = (actualOutputKg / expectedYieldKg) * 100;

      // Fetch yield standard for validation
      const yieldStandard = await models.YieldStandardMaster.findOne({
        where: {
          species_id: speciesId,
          derivative_id: derivativeId,
          processing_type: processingType,
          is_active: true,
        },
        attributes: [
          "id",
          "expected_yield_pct",
          "allowed_variance_pct",
          "min_yield_threshold",
          "max_yield_threshold",
        ],
        raw: true,
      });

      if (!yieldStandard) {
        throw new Error(
          `No yield standard found for species ${speciesId}, derivative ${derivativeId}, processing type ${processingType}`,
        );
      }

      // Calculate yield variance
      const expectedYieldPct = yieldStandard.expected_yield_pct;
      const yieldVariancePct = actualYieldPct - expectedYieldPct;

      // Determine status based on yield thresholds
      let status;
      let validationNotes = [];

      if (
        actualYieldPct >= yieldStandard.min_yield_threshold &&
        actualYieldPct <= yieldStandard.max_yield_threshold
      ) {
        status = "PASS";
        validationNotes.push("Yield within acceptable range");
      } else if (
        Math.abs(yieldVariancePct) <= yieldStandard.allowed_variance_pct
      ) {
        status = "PASS";
        validationNotes.push("Yield within variance tolerance");
      } else if (actualYieldPct < yieldStandard.min_yield_threshold) {
        status = "FAIL";
        validationNotes.push(
          `Yield below minimum threshold (${yieldStandard.min_yield_threshold}%)`,
        );
      } else {
        status = "HOLD";
        validationNotes.push("Yield above maximum threshold - requires review");
      }

      // Create production execution record
      const execution = await models.ProductionExecution.create({
        production_order_id: productionOrderId,
        actual_output_kg: actualOutputKg,
        expected_yield_kg: expectedYieldKg,
        actual_yield_pct: actualYieldPct,
        yield_variance_pct: yieldVariancePct,
        status: status,
        species_id: speciesId,
        derivative_id: derivativeId,
        processing_type: processingType,
        operator_id: operatorId,
        validation_notes: validationNotes.join("; "),
        notes: notes,
        executed_at: new Date(),
      });

      return {
        success: true,
        data: {
          executionId: execution.id,
          status: status,
          actualYieldPct: actualYieldPct.toFixed(2),
          expectedYieldPct: expectedYieldPct.toFixed(2),
          yieldVariancePct: yieldVariancePct.toFixed(2),
          validationResult: validationNotes.join("; "),
          yieldStandardId: yieldStandard.id,
          withinThresholds: status === "PASS",
          requiresReview: status === "HOLD",
          failed: status === "FAIL",
        },
      };
    } catch (error) {
      console.error("Error in recordProductionExecution:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get production execution history for a production order
   * @param {Object} params - { productionOrderId }
   * @returns {Array} - Array of execution records
   */
  static async getExecutionHistory(params) {
    try {
      const { productionOrderId } = params;

      const executions = await models.ProductionExecution.findAll({
        where: { production_order_id: productionOrderId },
        include: [
          {
            model: models.SpeciesMaster,
            as: "Species",
            attributes: ["species_name"],
          },
          {
            model: models.DerivativeMaster,
            as: "Derivative",
            attributes: ["derivative_name", "derivative_code"],
          },
          {
            model: models.UserProfiles,
            as: "Operator",
            attributes: ["first_name", "last_name"],
          },
        ],
        order: [["executed_at", "DESC"]],
        raw: true,
      });

      return {
        success: true,
        data: executions.map((exec) => ({
          id: exec.id,
          productionOrderId: exec.production_order_id,
          actualOutputKg: exec.actual_output_kg,
          expectedYieldKg: exec.expected_yield_kg,
          actualYieldPct: exec.actual_yield_pct,
          yieldVariancePct: exec.yield_variance_pct,
          status: exec.status,
          processingType: exec.processing_type,
          speciesName: exec["Species.species_name"],
          derivativeName: exec["Derivative.derivative_name"],
          derivativeCode: exec["Derivative.derivative_code"],
          operatorName: `${exec["Operator.first_name"]} ${exec["Operator.last_name"]}`,
          validationNotes: exec.validation_notes,
          notes: exec.notes,
          executedAt: exec.executed_at,
        })),
      };
    } catch (error) {
      console.error("Error in getExecutionHistory:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get yield performance analytics
   * @param {Object} params - { speciesId, derivativeId, processingType, dateFrom, dateTo }
   * @returns {Object} - Yield performance statistics
   */
  static async getYieldAnalytics(params) {
    try {
      const { speciesId, derivativeId, processingType, dateFrom, dateTo } =
        params;

      const whereClause = {
        status: { [Op.in]: ["PASS", "HOLD", "FAIL"] },
      };

      if (speciesId) whereClause.species_id = speciesId;
      if (derivativeId) whereClause.derivative_id = derivativeId;
      if (processingType) whereClause.processing_type = processingType;
      if (dateFrom && dateTo) {
        whereClause.executed_at = {
          [Op.between]: [dateFrom, dateTo],
        };
      }

      const executions = await models.ProductionExecution.findAll({
        where: whereClause,
        attributes: [
          "actual_yield_pct",
          "yield_variance_pct",
          "status",
          "processing_type",
        ],
        raw: true,
      });

      if (executions.length === 0) {
        return {
          success: true,
          data: {
            totalExecutions: 0,
            averageYieldPct: 0,
            averageVariancePct: 0,
            passRate: 0,
            failRate: 0,
            holdRate: 0,
            yieldDistribution: {},
          },
        };
      }

      // Calculate statistics
      const totalExecutions = executions.length;
      const averageYieldPct =
        executions.reduce((sum, exec) => sum + exec.actual_yield_pct, 0) /
        totalExecutions;
      const averageVariancePct =
        executions.reduce((sum, exec) => sum + exec.yield_variance_pct, 0) /
        totalExecutions;

      const statusCounts = executions.reduce((counts, exec) => {
        counts[exec.status] = (counts[exec.status] || 0) + 1;
        return counts;
      }, {});

      const passRate = ((statusCounts.PASS || 0) / totalExecutions) * 100;
      const failRate = ((statusCounts.FAIL || 0) / totalExecutions) * 100;
      const holdRate = ((statusCounts.HOLD || 0) / totalExecutions) * 100;

      // Yield distribution (bucketed by 5% ranges)
      const yieldDistribution = executions.reduce((dist, exec) => {
        const bucket = Math.floor(exec.actual_yield_pct / 5) * 5;
        const bucketKey = `${bucket}-${bucket + 5}%`;
        dist[bucketKey] = (dist[bucketKey] || 0) + 1;
        return dist;
      }, {});

      return {
        success: true,
        data: {
          totalExecutions,
          averageYieldPct: averageYieldPct.toFixed(2),
          averageVariancePct: averageVariancePct.toFixed(2),
          passRate: passRate.toFixed(2),
          failRate: failRate.toFixed(2),
          holdRate: holdRate.toFixed(2),
          statusBreakdown: statusCounts,
          yieldDistribution,
          dateRange: dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null,
        },
      };
    } catch (error) {
      console.error("Error in getYieldAnalytics:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update execution status (for review/approval workflow)
   * @param {Object} params - { executionId, newStatus, reviewerId, reviewNotes }
   * @returns {Object} - Updated execution record
   */
  static async updateExecutionStatus(params) {
    try {
      const { executionId, newStatus, reviewerId, reviewNotes } = params;

      const execution = await models.ProductionExecution.findByPk(executionId);

      if (!execution) {
        throw new Error(`Production execution ${executionId} not found`);
      }

      // Update status and review information
      await execution.update({
        status: newStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date(),
        review_notes: reviewNotes,
        updated_by: reviewerId,
      });

      return {
        success: true,
        data: {
          executionId: execution.id,
          newStatus: newStatus,
          reviewedAt: execution.reviewed_at,
          reviewNotes: reviewNotes,
        },
      };
    } catch (error) {
      console.error("Error in updateExecutionStatus:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default ProductionExecutionService;
