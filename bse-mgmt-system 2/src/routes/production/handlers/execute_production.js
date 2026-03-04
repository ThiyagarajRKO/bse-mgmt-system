/**
 * Production Execution Handler
 *
 * Endpoint: POST /api/production/:production_order_id/execute
 *
 * Records actual production output and creates finished goods
 */

import ProductionOrderService from "../../../services/ProductionOrderService";
import models from "../../../models";

export const ExecuteProduction = async (
  { production_order_id, actual_quantity_kg, wastage_kg = 0, remarks = "" },
  session,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("ExecuteProduction called with:", {
        production_order_id,
        actual_quantity_kg,
        wastage_kg,
      });

      // Validate inputs
      if (!production_order_id) {
        return reject({
          statusCode: 400,
          message: "Production order ID is required",
        });
      }

      if (!actual_quantity_kg || actual_quantity_kg <= 0) {
        return reject({
          statusCode: 400,
          message: "Actual quantity must be greater than 0",
        });
      }

      // Verify production order exists
      const prodOrder =
        await models.ProductionOrder.findByPk(production_order_id);

      if (!prodOrder) {
        return reject({
          statusCode: 404,
          message: `Production order not found: ${production_order_id}`,
        });
      }

      if (prodOrder.status === "COMPLETED") {
        return reject({
          statusCode: 400,
          message: "This production order is already completed",
        });
      }

      // Execute production through service
      const result = await ProductionOrderService.recordProductionOutput(
        production_order_id,
        actual_quantity_kg,
        wastage_kg,
        remarks,
      );

      resolve({
        success: true,
        statusCode: 200,
        data: {
          production_order_id: result.production_order.id,
          production_order_no: result.production_order.order_no,
          production_output_id: result.production_output.id,
          finished_goods_id: result.finished_goods.id,
          planned_quantity_kg: parseFloat(
            result.production_order.planned_quantity_kg,
          ),
          actual_quantity_kg: parseFloat(
            result.production_output.actual_quantity_kg,
          ),
          wastage_kg: parseFloat(result.production_order.wastage_quantity_kg),
          yield_percent: parseFloat(
            result.production_output.actual_yield_percent,
          ),
          finished_goods_quantity_kg: parseFloat(
            result.finished_goods.quantity,
          ),
          status: result.production_order.status,
          inventory_posted: result.production_output.inventory_posted,
        },
        message: result.message,
      });
    } catch (error) {
      console.error("Error in ExecuteProduction:", error);
      reject({
        statusCode: 500,
        message: error.message || "Failed to execute production",
        error: error,
      });
    }
  });
};

/**
 * Get Production Order Details
 * Endpoint: GET /api/production/:production_order_id
 */
export const GetProductionOrderDetails = async (
  { production_order_id },
  session,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const details =
        await ProductionOrderService.getProductionOrderDetails(
          production_order_id,
        );

      if (!details) {
        return reject({
          statusCode: 404,
          message: `Production order not found: ${production_order_id}`,
        });
      }

      resolve({
        success: true,
        statusCode: 200,
        data: details,
      });
    } catch (error) {
      console.error("Error fetching production order:", error);
      reject({
        statusCode: 500,
        message: error.message || "Failed to fetch production order",
      });
    }
  });
};

/**
 * Get Pending Production Orders
 * Endpoint: GET /api/production/orders/pending
 */
export const GetPendingProductionOrders = async (
  { limit = 50, offset = 0 },
  session,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ProductionOrderService.getPendingProductionOrders(
        parseInt(limit),
        parseInt(offset),
      );

      resolve({
        success: true,
        statusCode: 200,
        data: {
          total: result.count,
          rows: result.rows,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Error fetching pending production orders:", error);
      reject({
        statusCode: 500,
        message: error.message || "Failed to fetch pending production orders",
      });
    }
  });
};
