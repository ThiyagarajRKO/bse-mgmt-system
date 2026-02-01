/**
 * Production Workflow API Routes
 * Handles BOM-driven production workflow with FIFO inventory management
 */

import models from "../../../models";

export default async (fastify) => {
  // Create Production Order
  fastify.post("/orders", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          order_no,
          plant_id,
          input_species_id,
          planned_quantity_kg,
          initial_grade,
          size_code,
          remarks,
          order_id,
        } = request.body;

        // Validate required fields
        if (!order_no || !input_species_id || !planned_quantity_kg) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Missing required fields",
          });
        }

        // Create production order with PLANNED status
        const productionOrder = await models.production_orders.create({
          order_no,
          plant_id,
          input_species_id,
          planned_quantity_kg,
          initial_grade,
          size_code,
          remarks,
          order_id,
          status: "PLANNED",
          created_by: request.session.pid,
        });

        reply.code(201).send({
          statusCode: 201,
          message: "Production order created successfully",
          data: productionOrder,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error creating production order",
          error: error.message,
        });
      }
    },
  });

  // Get All Production Orders (Paginated)
  fastify.get("/orders", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { page = 1, limit = 20, status, species_id } = request.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (species_id) where.input_species_id = species_id;

        const { count, rows } = await models.production_orders.findAndCountAll({
          where,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [["created_at", "DESC"]],
        });

        return reply.send({
          statusCode: 200,
          data: rows,
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          statusCode: 500,
          message: "Error fetching production orders",
          error: error.message,
        });
      }
    },
  });

  // Get Single Production Order
  fastify.get("/orders/:id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;

        const productionOrder = await ProductionOrder.findByPk(id);

        if (!productionOrder) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Production order not found",
          });
        }

        return reply.send({
          statusCode: 200,
          data: productionOrder,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          statusCode: 500,
          message: "Error fetching production order",
          error: error.message,
        });
      }
    },
  });

  // Start Production (BOM Explosion)
  fastify.post("/:id/start", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;

        const productionOrder = await ProductionOrder.findByPk(id);

        if (!productionOrder) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Production order not found",
          });
        }

        // Check inventory availability for raw material
        const InventoryStock = require("../../../models").inventory_stock;
        const rawInventory = await InventoryStock.findOne({
          where: {
            product_id: productionOrder.input_species_id,
            unit_id: "RAW_INVENTORY",
          },
          attributes: ["available_qty"],
        });

        const availableQty = rawInventory
          ? parseFloat(rawInventory.available_qty)
          : 0;
        const requiredQty = parseFloat(productionOrder.planned_quantity_kg);

        if (availableQty < requiredQty) {
          return reply.code(400).send({
            statusCode: 400,
            message: `Insufficient inventory. Available: ${availableQty} kg, Required: ${requiredQty} kg`,
            data: {
              available_quantity: availableQty,
              required_quantity: requiredQty,
              can_proceed: false,
            },
          });
        }

        // Get BOM for species
        const BOM = require("../../../models").BOM;
        const bomRule = require("../../../models").BOMRule;

        const bom = await BOM.findOne({
          where: { input_species_id: productionOrder.input_species_id },
        });

        if (!bom) {
          return reply.code(400).send({
            statusCode: 400,
            message: "BOM not found for species",
          });
        }

        // Calculate BOM explosion
        const rules = await bomRule.findAll({
          where: { bom_id: bom.id },
        });

        const bomExplosion = rules.map((rule) => ({
          derivative_id: rule.derivative_id,
          base_yield_percent: rule.base_yield_percent,
          grade_multiplier: rule.grade_multiplier || 1,
          size_multiplier: rule.size_multiplier || 1,
          effective_yield_percent:
            (rule.base_yield_percent *
              (rule.grade_multiplier || 1) *
              (rule.size_multiplier || 1)) /
            100,
          planned_quantity_kg:
            (productionOrder.planned_quantity_kg *
              rule.base_yield_percent *
              (rule.grade_multiplier || 1) *
              (rule.size_multiplier || 1)) /
            10000,
        }));

        // Update production order status
        await productionOrder.update({ status: "RAW_ISSUED" });

        return reply.send({
          statusCode: 200,
          message: "Production started",
          data: {
            id: productionOrder.id,
            status: "RAW_ISSUED",
            bom_explosion: bomExplosion,
            started_at: new Date(),
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
    },
  });

  // Consume Raw Material (FIFO)
  fastify.post("/:id/consume", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { lot_allocations } = request.body;

        const productionOrder = await ProductionOrder.findByPk(id);

        if (!productionOrder) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Production order not found",
          });
        }

        // Create production consumption records
        let totalConsumed = 0;
        const consumptionRecords = [];

        for (const allocation of lot_allocations) {
          const consumption = await ProductionConsumption.create({
            production_order_id: id,
            inventory_lot_id: allocation.inventory_lot_id,
            quantity_kg: allocation.quantity_kg,
            cost_per_unit: allocation.cost_per_unit,
            total_cost: allocation.quantity_kg * allocation.cost_per_unit,
          });
          consumptionRecords.push(consumption);
          totalConsumed += allocation.quantity_kg;
        }

        // Create GL posting: DR WIP / CR RAW
        const totalCost = lot_allocations.reduce(
          (sum, a) => sum + a.quantity_kg * a.cost_per_unit,
          0,
        );

        await GLPosting.create({
          reference_type: "PRODUCTION_CONSUMPTION",
          reference_id: id,
          debit_account: "WIP_INVENTORY",
          credit_account: "RAW_INVENTORY",
          amount: totalCost,
          description: `Raw material consumed for production order ${productionOrder.order_no}`,
        });

        return reply.send({
          statusCode: 200,
          message: "Raw material consumed",
          data: {
            id: productionOrder.id,
            status: "RAW_ISSUED",
            transaction_id: consumptionRecords[0]?.id,
            gl_entries_created: 1,
            total_consumed_kg: totalConsumed,
            total_cost: totalCost,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        reply.code(500).send({
          statusCode: 500,
          message: "Error consuming raw material",
          error: error.message,
        });
      }
    },
  });

  // Record Production Output
  fastify.post("/:id/output", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { actual_outputs } = request.body;

        const productionOrder = await ProductionOrder.findByPk(id);

        if (!productionOrder) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Production order not found",
          });
        }

        // Record actual outputs and calculate variance
        const varianceRecords = [];
        let fgInventoryCount = 0;
        let glEntriesCount = 0;

        for (const output of actual_outputs) {
          // Create variance record
          const variance = await ProductionVariance.create({
            production_order_id: id,
            derivative_id: output.derivative_id,
            planned_quantity_kg: output.expected_quantity_kg || 0,
            actual_quantity_kg: output.actual_quantity_kg,
            variance_quantity_kg:
              output.actual_quantity_kg - (output.expected_quantity_kg || 0),
            variance_percent:
              ((output.actual_quantity_kg -
                (output.expected_quantity_kg || 0)) /
                (output.expected_quantity_kg || 1)) *
              100,
            variance_type:
              Math.abs(
                ((output.actual_quantity_kg -
                  (output.expected_quantity_kg || 0)) /
                  (output.expected_quantity_kg || 1)) *
                  100,
              ) > 5
                ? "ABNORMAL"
                : "NORMAL",
            variance_reason: output.variance_reason,
          });

          varianceRecords.push(variance);
          fgInventoryCount++;

          // Post GL for abnormal variance
          if (variance.variance_type === "ABNORMAL") {
            await GLPosting.create({
              reference_type: "PRODUCTION_VARIANCE",
              reference_id: variance.id,
              debit_account: "VARIANCE_LOSS",
              credit_account: "COGS",
              amount: Math.abs(variance.variance_quantity_kg * 100), // Estimate cost
              description: `Abnormal variance for ${output.derivative_id} in production order ${productionOrder.order_no}`,
            });
            glEntriesCount++;
          }
        }

        // Create GL posting: DR FG / CR WIP
        const totalOutputCost = varianceRecords.reduce(
          (sum, v) => sum + v.actual_quantity_kg * 100,
          0,
        ); // Estimated

        await GLPosting.create({
          reference_type: "PRODUCTION_OUTPUT",
          reference_id: id,
          debit_account: "CS_INVENTORY",
          credit_account: "WIP_INVENTORY",
          amount: totalOutputCost,
          description: `Production output recorded for order ${productionOrder.order_no}`,
        });
        glEntriesCount++;

        // Update production order status
        await productionOrder.update({ status: "COMPLETED" });

        return reply.send({
          statusCode: 200,
          message: "Production output recorded",
          data: {
            id: productionOrder.id,
            status: "COMPLETED",
            fg_inventory_created: fgInventoryCount,
            fg_transaction_id: varianceRecords[0]?.id,
            variance_records: varianceRecords,
            total_gl_entries_posted: glEntriesCount,
            completed_at: new Date(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          statusCode: 500,
          message: "Error recording production output",
          error: error.message,
        });
      }
    },
  });

  // Close Production Order
  fastify.post("/:id/close", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        const { remarks } = request.body;

        const productionOrder = await ProductionOrder.findByPk(id);

        if (!productionOrder) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Production order not found",
          });
        }

        if (productionOrder.status !== "COMPLETED") {
          return reply.code(400).send({
            statusCode: 400,
            message: "Order must be COMPLETED before closing",
          });
        }

        await productionOrder.update({
          status: "CLOSED",
          remarks,
          closed_at: new Date(),
        });

        return reply.send({
          statusCode: 200,
          message: "Production order closed",
          data: {
            id: productionOrder.id,
            status: "CLOSED",
            closed_at: new Date(),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          statusCode: 500,
          message: "Error closing production order",
          error: error.message,
        });
      }
    },
  });

  // Get Variance Report
  fastify.get("/:id/variance", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;

        const variances = await ProductionVariance.findAll({
          where: { production_order_id: id },
        });

        const glPostings = await GLPosting.findAll({
          where: { reference_type: "PRODUCTION_VARIANCE" },
        });

        const normalCount = variances.filter(
          (v) => v.variance_type === "NORMAL",
        ).length;
        const abnormalCount = variances.filter(
          (v) => v.variance_type === "ABNORMAL",
        ).length;

        return reply.send({
          statusCode: 200,
          data: {
            derivative_count: variances.length,
            normal_variance_count: normalCount,
            abnormal_variance_count: abnormalCount,
            gl_posted_count: glPostings.length,
            variances,
            gl_postings: glPostings,
            summary: {
              total_planned_kg: variances.reduce(
                (sum, v) => sum + v.planned_quantity_kg,
                0,
              ),
              total_actual_kg: variances.reduce(
                (sum, v) => sum + v.actual_quantity_kg,
                0,
              ),
              total_variance_kg: variances.reduce(
                (sum, v) => sum + v.variance_quantity_kg,
                0,
              ),
              overall_variance_percent:
                variances.length > 0
                  ? variances.reduce((sum, v) => sum + v.variance_percent, 0) /
                    variances.length
                  : 0,
            },
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          statusCode: 500,
          message: "Error fetching variance report",
          error: error.message,
        });
      }
    },
  });
};
