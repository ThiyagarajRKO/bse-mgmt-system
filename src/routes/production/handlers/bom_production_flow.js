/**
 * Complete BOM-Driven Production Flow
 *
 * This handler orchestrates:
 * 1. BOM Explosion (plan derivatives)
 * 2. Raw Consumption (consume from inventory)
 * 3. Production Output (record actuals)
 * 4. Variance Calculation (post GL if abnormal)
 *
 * STATE MACHINE:
 *   PLANNED
 *      ↓ [POST /production/{id}/consume]
 *   RAW_ISSUED
 *      ↓ [POST /production/{id}/output]
 *   COMPLETED
 *      ↓ [POST /production/{id}/close]
 *   CLOSED
 */

import { explodeBOM } from "./bom_explosion";
import { consumeRawMaterial } from "./raw_consumption";
import { receiveProductionOutput } from "./production_output";

export async function startProduction(fastify, request, reply, db) {
  try {
    const { production_order_id } = request.params;
    const { initial_grade = "B", size_code = "MEDIUM" } = request.body;

    // Step 1: Get production order
    const po = await db.models.production_orders.findByPk(production_order_id);
    if (!po) {
      return reply.code(404).send({
        statusCode: 404,
        message: "Production order not found",
      });
    }

    if (po.status !== "PLANNED") {
      return reply.code(400).send({
        statusCode: 400,
        message: `Production order must be PLANNED. Current: ${po.status}`,
      });
    }

    // Step 2: Explode BOM
    const bomExplosion = await explodeBOM({
      input_species_id: po.input_species_id,
      planned_quantity_kg: po.planned_quantity_kg,
      initial_grade,
      size_code,
    });

    // Step 3: Create production_output_plan records
    for (const output of bomExplosion.planned_outputs) {
      if (output.derivative_id) {
        // Skip WASTE line
        await db.models.production_outputs.create({
          production_order_id,
          derivative_id: output.derivative_id,
          expected_quantity_kg: output.planned_quantity_kg,
          expected_grade: initial_grade,
          size_code,
          actual_quantity_kg: 0,
          actual_grade: initial_grade,
          expected_yield_percent: output.effective_yield_percent,
          actual_yield_percent: 0,
          inventory_posted: false,
          gl_posted: false,
        });
      }
    }

    // Step 4: Update production order status
    await po.update({
      status: "RAW_ISSUED",
    });

    return reply.code(200).send({
      statusCode: 200,
      message: "Production started - BOM exploded successfully",
      data: {
        production_order_id,
        bom_explosion: bomExplosion,
        planned_output_lines: bomExplosion.planned_outputs.length,
      },
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      message: "Error starting production",
      error: error.message,
    });
  }
}

export async function consumeRaw(fastify, request, reply, db) {
  try {
    const { production_order_id } = request.params;

    const result = await consumeRawMaterial(production_order_id, db);

    return reply.code(200).send({
      statusCode: 200,
      message: "Raw material consumed successfully",
      data: result,
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      message: "Error consuming raw material",
      error: error.message,
    });
  }
}

export async function receiveOutput(fastify, request, reply, db) {
  try {
    const { production_order_id } = request.params;
    const { actual_outputs } = request.body;

    // Validate input
    if (!Array.isArray(actual_outputs)) {
      return reply.code(400).send({
        statusCode: 400,
        message: "actual_outputs must be an array",
      });
    }

    const result = await receiveProductionOutput(
      production_order_id,
      actual_outputs,
      db
    );

    return reply.code(200).send({
      statusCode: 200,
      message: "Production output received successfully",
      data: result,
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      message: "Error receiving production output",
      error: error.message,
    });
  }
}

export async function closeProduction(fastify, request, reply, db) {
  try {
    const { production_order_id } = request.params;

    const po = await db.models.production_orders.findByPk(production_order_id);
    if (!po) {
      return reply.code(404).send({
        statusCode: 404,
        message: "Production order not found",
      });
    }

    if (po.status !== "COMPLETED") {
      return reply.code(400).send({
        statusCode: 400,
        message: `Production order must be COMPLETED to close. Current: ${po.status}`,
      });
    }

    // Close production order
    await po.update({
      status: "CLOSED",
      closed_at: new Date(),
    });

    return reply.code(200).send({
      statusCode: 200,
      message: "Production order closed successfully",
      data: { production_order_id, status: "CLOSED" },
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({
      statusCode: 500,
      message: "Error closing production order",
      error: error.message,
    });
  }
}

export default {
  startProduction,
  consumeRaw,
  receiveOutput,
  closeProduction,
};
