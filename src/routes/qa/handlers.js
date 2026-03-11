import { Op } from "sequelize";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fastify constraint for UUID validation
const uuidConstraint = {
  qa_id: UUID_PATTERN,
};

export default async (fastify) => {
  // ======================= GET ALL QA RECORDS =======================
  // IMPORTANT: Register GET / FIRST before any parameterized routes
  // This ensures /api/qa/records is matched to GET / not GET /:qa_id
  fastify.get("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          page = 1,
          limit = 10,
          lot_no,
          status,
          product,
          order_id,
          peeled_dispatch_id,
        } = request.query;
        const offset = (page - 1) * limit;

        // Build where clause for QA records
        let whereClause = {};

        // If status is provided, filter by that status
        if (status) {
          whereClause.status = status;
        }

        // If lot_no is provided, filter by that
        if (lot_no) {
          whereClause.lot_no = {
            [Op.like]: `%${lot_no}%`,
          };
        }

        // If product is provided, filter by that
        if (product) {
          whereClause.product = {
            [Op.like]: `%${product}%`,
          };
        }

        // If peeled_dispatch_id is provided, filter by it as well
        if (peeled_dispatch_id) {
          whereClause.peeled_dispatch_id = peeled_dispatch_id;
        }

        // allow filtering by order_id directly on the checklist table
        if (order_id) {
          whereClause.order_id = order_id;
        }

        // Fetch all QA records from qa_checklists table
        // Sequelizes selects all attributes of peeling_products by default when
        // included with no `attributes` array. That means our recently-added
        // order_id column will be referenced in the generated SQL.  On databases
        // that have not yet been migrated this column does not exist, and
        // Sequelize throws a 42703 error which would crash the request.  To
        // be resilient we attempt the query normally and if we hit that
        // specific error we retry without selecting peeling_products at all.

        const buildIncludes = (includeProducts = true) => {
          const includes = [
            {
              model: fastify.models.Orders,
              as: "order",
              required: false,
              attributes: ["id", "order_no"],
            },
            {
              model: fastify.models.Peeling,
              as: "peeling",
              required: false,
              attributes: [
                "id",
                "created_at",
                "peeling_quantity",
                "peeling_method",
                "dispatch_id",
              ],
              include: [],
            },
          ];

          if (includeProducts) {
            includes[1].include.push({
              model: fastify.models.PeelingProducts,
              required: false,
              separate: true, // Fetch separately to avoid row multiplication
              include: [
                {
                  model: fastify.models.ProductMaster,
                  required: false,
                  attributes: ["id", "product_name"],
                },
                {
                  model: fastify.models.PeeledDispatches,
                  required: false,
                  attributes: ["id", "peeled_dispatch_quantity"],
                },
              ],
            });
          }

          // always add the dispatch -> procurement path
          includes[1].include.push({
            model: fastify.models.Dispatches,
            as: "dis",
            required: false,
            attributes: ["id", "dispatch_quantity", "procurement_product_id"],
            include: [
              {
                model: fastify.models.ProcurementProducts,
                as: "pp",
                required: false,
                attributes: [
                  "id",
                  "procurement_quantity",
                  "procurement_lot_id",
                ],
                include: [
                  {
                    model: fastify.models.ProcurementLots,
                    as: "pl",
                    required: false,
                    attributes: ["id", "procurement_lot"],
                  },
                ],
              },
            ],
          });

          return includes;
        };

        let count, rows;
        try {
          ({ count, rows } = await fastify.models.QAChecklist.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [["created_at", "DESC"]],
            include: buildIncludes(true),
            distinct: true, // Prevent row multiplication from nested JOINs
          }));
        } catch (err) {
          // if the error indicates the order_id column is missing, retry
          if (
            err?.parent?.code === "42703" &&
            (/PeelingProducts\.order_id/.test(err.parent.message) ||
              /qa_checklist\.order_id/.test(err.parent.message))
          ) {
            fastify.log.warn(
              "QA handler: order_id column missing, retrying without product include",
            );
            ({ count, rows } = await fastify.models.QAChecklist.findAndCountAll(
              {
                where: whereClause,
                limit: parseInt(limit),
                offset: offset,
                order: [["created_at", "DESC"]],
                include: buildIncludes(false),
                distinct: true, // Prevent row multiplication from nested JOINs
              },
            ));
          } else {
            throw err;
          }
        }

        // recalculate status for any records still marked PENDING (old data)
        // we also persist the recalculated value so that subsequent fetches
        // don't keep returning PENDING rows.
        const recalcRow = async (row) => {
          if (row.status && row.status !== "PENDING") return;
          // simple criteria matching create/update logic
          let calculated = "PASS";
          const bp = parseFloat(row.broken_percentage) || 0;
          const temp = parseFloat(row.temperature) || 0;
          const fm =
            row.foreign_matter === true || row.foreign_matter === "true";
          if (
            bp > 20 ||
            temp > -15 ||
            fm ||
            row.odour_status === "UNACCEPTABLE" ||
            row.appearance_status === "POOR"
          ) {
            calculated = "FAIL";
          }
          if (calculated !== row.status) {
            row.status = calculated;
            try {
              await fastify.models.QAChecklist.update(
                { status: calculated },
                { where: { id: row.id } },
              );
            } catch (e) {
              fastify.log.error(
                `[QA] error persisting recalculated status for ${row.id}: ${e.message}`,
              );
            }
          }
        };
        await Promise.all(rows.map(recalcRow));

        // ensure each row has an order_id property for easier tracing/filtering
        rows = rows.map((row) => {
          if (!row.order_id) {
            // try the direct association first
            if (row.order && row.order.id) {
              row.order_id = row.order.id;
            } else if (row.peeling && row.peeling.order_id) {
              row.order_id = row.peeling.order_id;
            } else if (
              row.peeling &&
              row.peeling.dis &&
              row.peeling.dis.order_id
            ) {
              row.order_id = row.peeling.dis.order_id;
            }
            // finally fall back to products path if available
            if (!row.order_id && row.peeling && row.peeling.PeelingProducts) {
              for (const pp of row.peeling.PeelingProducts) {
                if (pp.order_id) {
                  row.order_id = pp.order_id;
                  break;
                }
              }
            }
          }
          return row;
        });

        return reply.code(200).send({
          statusCode: 200,
          message: "QA records fetched successfully",
          quantityLabel: "Peeled Quantity (kg)",
          quantityDescription:
            "Quantity represents the peeled/yield quantity from PeelingProducts, not the dispatched quantity",
          data: { rows, count },
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit),
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });

  // ======================= AUTOPOPULATE ENDPOINT =======================
  // Auto-populate QA records from peeling data
  fastify.post("/autopopulate", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        // Get all peeling records that don't have a corresponding QA record
        const peelings = await fastify.models.Peeling.findAll({
          include: [
            {
              model: fastify.models.PeelingProducts,
              include: [
                {
                  model: fastify.models.ProductMaster,
                  attributes: ["id", "product_name"],
                },
              ],
            },
            {
              model: fastify.models.Orders,
              include: [
                {
                  model: fastify.models.ProcurementLots,
                  as: "procurement_lots",
                  attributes: ["id", "procurement_lot"],
                },
              ],
            },
          ],
          raw: false,
        });

        console.log(`Found ${peelings.length} peeling records`);

        let createdCount = 0;
        const createdRecords = [];
        let skippedCount = 0;

        for (const peeling of peelings) {
          // Check if QA record already exists for this peeling
          const existingQA = await fastify.models.QAChecklist.findOne({
            where: { peeling_id: peeling.id },
          });

          if (existingQA) {
            console.log(
              `Skipping peeling ${peeling.id} - QA record already exists`,
            );
            skippedCount++;
            continue;
          }

          if (
            !peeling.PeelingProducts ||
            peeling.PeelingProducts.length === 0
          ) {
            console.log(`Skipping peeling ${peeling.id} - No peeling products`);
            skippedCount++;
            continue;
          }

          // Get primary product name from first peeling product
          const primaryProduct = peeling.PeelingProducts[0].ProductMaster;
          const totalYield = peeling.PeelingProducts.reduce(
            (sum, pp) => sum + (parseFloat(pp.yield_quantity) || 0),
            0,
          );

          // Generate lot_no: QA-<ProcurementLot> format
          let lot_no = null;
          if (peeling.Order?.procurement_lots?.[0]?.procurement_lot) {
            lot_no = `QA-${peeling.Order.procurement_lots[0].procurement_lot}`;
          } else {
            // Skip records without procurement lot (don't create QA-AUTO format)
            console.log(
              `Skipping peeling ${peeling.id} - No procurement lot found for lot number generation`,
            );
            skippedCount++;
            continue;
          }

          // compute default status based on some safe defaults (all good)
          let defaultStatus = "PASS";
          // if we ever want to auto-fail based on any criteria we can adjust here
          const qa = await fastify.models.QAChecklist.create({
            lot_no: lot_no,
            order_id: peeling.order_id,
            peeling_id: peeling.id,
            product: primaryProduct.product_name,
            quantity: totalYield,
            broken_percentage: 0,
            glazing_percentage: 0,
            temperature: 20,
            odour_status: "GOOD",
            appearance_status: "GOOD",
            foreign_matter: false,
            sample_size: 100,
            net_weight_avg: 95,
            status: defaultStatus,
            inspection_date: new Date(),
          });

          createdCount++;
          console.log(`Created QA record: ${qa.id} for peeling ${peeling.id}`);
          createdRecords.push({
            id: qa.id,
            lot_no: qa.lot_no,
            product: qa.product,
            status: qa.status,
          });
        }

        return reply.code(200).send({
          statusCode: 200,
          message: `Auto-population completed. Created ${createdCount} QA records from peeling data with status Pending.`,
          created: createdCount,
          skipped: skippedCount,
          total_peelings: peelings.length,
          records: createdRecords,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });

  // ======================= CREATE QA RECORD =======================
  // This endpoint accepts POST without requiring a JSON body
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          lot_no,
          order_id,
          peeling_id,
          product,
          quantity,
          broken_percentage,
          glazing_percentage,
          temperature,
          odour_status,
          appearance_status,
          foreign_matter,
          sample_size,
          net_weight_avg,
          // status may come from client but will be ignored
          inspection_date,
          inspector_name,
          remarks,
          defects,
        } = request.body;
        const profile_id = request.token_profile_id;

        if (!lot_no) {
          return reply.code(400).send({
            statusCode: 400,
            message: "lot_no is required",
          });
        }

        if (
          status &&
          !["PENDING", "PASS", "FAIL", "ON_HOLD"].includes(status)
        ) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid status. Must be PENDING, PASS, FAIL, or ON_HOLD",
          });
        }

        // calculate status server-side rather than trusting client
        let computedStatus = "PASS";
        const reasons = [];
        const bp = parseFloat(broken_percentage) || 0;
        const temp = parseFloat(temperature) || 0;
        if (bp > 20) {
          computedStatus = "FAIL";
          reasons.push("Broken % exceeds Grade C limit");
        }
        if (temp > -15) {
          computedStatus = "FAIL";
          reasons.push("Temperature above acceptable range");
        }
        if (foreign_matter === true || foreign_matter === "true") {
          computedStatus = "FAIL";
          reasons.push("Foreign matter detected");
        }
        if (odour_status === "UNACCEPTABLE" || appearance_status === "POOR") {
          computedStatus = "FAIL";
          if (odour_status === "UNACCEPTABLE")
            reasons.push("Odour unacceptable");
          if (appearance_status === "POOR") reasons.push("Appearance poor");
        }

        // Create QA record
        const qa = await fastify.models.QAChecklist.create({
          lot_no,
          order_id: order_id || null,
          peeling_id: peeling_id || null,
          product,
          quantity: quantity ? parseFloat(quantity) : null,
          broken_percentage: broken_percentage
            ? parseFloat(broken_percentage)
            : null,
          glazing_percentage: glazing_percentage
            ? parseFloat(glazing_percentage)
            : null,
          temperature: temperature ? parseFloat(temperature) : null,
          odour_status,
          appearance_status,
          foreign_matter: foreign_matter === true || foreign_matter === "true",
          sample_size: sample_size ? parseFloat(sample_size) : null,
          net_weight_avg: net_weight_avg ? parseFloat(net_weight_avg) : null,
          status: computedStatus,
          inspection_date: inspection_date ? new Date(inspection_date) : null,
          inspector_name,
          remarks,
          defects,
          created_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "QA record created successfully",
          data: qa,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });

  // ======================= GET SINGLE QA RECORD =======================
  fastify.get("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;

        if (!qa_id || !UUID_PATTERN.test(qa_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: `Invalid qa_id format. Expected UUID but got: "${qa_id}"`,
          });
        }
        const qa = await fastify.models.QAChecklist.findByPk(qa_id, {
          include: [
            {
              model: fastify.models.Orders,
              as: "order",
              required: false,
              attributes: ["id", "order_no"],
            },
            {
              model: fastify.models.Peeling,
              as: "peeling",
              required: false,
              include: [
                {
                  model: fastify.models.PeelingProducts,
                  required: false,
                  include: [
                    {
                      model: fastify.models.ProductMaster,
                      required: false,
                      attributes: ["id", "product_name"],
                    },
                  ],
                },
              ],
            },
          ],
        });

        if (!qa) {
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        // recalc status for fetched record if it is still pending
        if (qa.status === "PENDING") {
          let calc = "PASS";
          const bp = parseFloat(qa.broken_percentage) || 0;
          const temp = parseFloat(qa.temperature) || 0;
          const fm = qa.foreign_matter === true || qa.foreign_matter === "true";
          if (
            bp > 20 ||
            temp > -15 ||
            fm ||
            qa.odour_status === "UNACCEPTABLE" ||
            qa.appearance_status === "POOR"
          ) {
            calc = "FAIL";
          }
          if (calc !== qa.status) {
            qa.status = calc;
            // persist so database doesn't remain stuck in PENDING
            try {
              await qa.update({ status: calc });
            } catch (e) {
              fastify.log.error(
                `[QA] error persisting recalculated status for single fetch ${qa.id}: ${e.message}`,
              );
            }
          }
        }

        return reply.code(200).send({
          statusCode: 200,
          message: "QA record fetched successfully",
          data: qa,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });

  // ======================= UPDATE QA RECORD =======================
  fastify.put("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;

        // Handle both wrapped (qa_data object) and unwrapped request bodies
        const bodyData = request.body.qa_data || request.body;

        const {
          lot_no,
          order_id,
          product,
          quantity,
          broken_percentage,
          glazing_percentage,
          temperature,
          odour_status,
          appearance_status,
          foreign_matter,
          sample_size,
          net_weight_avg,
          status,
          inspection_date,
          inspector_name,
          remarks,
          defects,
        } = bodyData;
        const profile_id = request.token_profile_id;

        if (!qa_id || !UUID_PATTERN.test(qa_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: `Invalid qa_id format. Expected UUID but got: "${qa_id}"`,
          });
        }

        const qa = await fastify.models.QAChecklist.findByPk(qa_id);
        if (!qa) {
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        const updates = { updated_by: profile_id };

        // Update all provided fields
        if (lot_no) updates.lot_no = lot_no;
        if (order_id !== undefined) updates.order_id = order_id;
        if (product) updates.product = product;
        if (quantity) updates.quantity = parseFloat(quantity);
        if (broken_percentage !== undefined && broken_percentage !== null)
          updates.broken_percentage = parseFloat(broken_percentage);
        if (glazing_percentage !== undefined && glazing_percentage !== null)
          updates.glazing_percentage = parseFloat(glazing_percentage);
        if (temperature !== undefined && temperature !== null)
          updates.temperature = parseFloat(temperature);
        if (odour_status) updates.odour_status = odour_status;
        if (appearance_status) updates.appearance_status = appearance_status;
        if (foreign_matter !== undefined)
          updates.foreign_matter =
            foreign_matter === true || foreign_matter === "true";
        if (sample_size !== undefined && sample_size !== null)
          updates.sample_size = parseFloat(sample_size);
        if (net_weight_avg !== undefined && net_weight_avg !== null)
          updates.net_weight_avg = parseFloat(net_weight_avg);
        if (inspection_date)
          updates.inspection_date = new Date(inspection_date);
        if (inspector_name) updates.inspector_name = inspector_name;
        if (remarks) updates.remarks = remarks;
        if (defects) updates.defects = defects;

        // Auto-calculate QA status based on criteria
        // IMPORTANT: Always recalculate unless explicitly setting to ON_HOLD
        const shouldRecalculate = status !== "ON_HOLD";

        if (shouldRecalculate) {
          // Use updated values if provided, otherwise use current values
          const finalBrokenPercent =
            broken_percentage !== undefined && broken_percentage !== null
              ? parseFloat(broken_percentage)
              : qa.broken_percentage;
          const finalTemp =
            temperature !== undefined && temperature !== null
              ? parseFloat(temperature)
              : qa.temperature;
          const finalForeignMatter =
            foreign_matter !== undefined
              ? foreign_matter === true || foreign_matter === "true"
              : qa.foreign_matter;
          const finalOdourStatus = odour_status || qa.odour_status;
          const finalAppearanceStatus =
            appearance_status || qa.appearance_status;

          // Evaluate criteria
          let calculatedStatus = "PASS";

          // Check broken percentage (should be <= 20 for Grade C pass)
          if (finalBrokenPercent > 20) {
            calculatedStatus = "FAIL";
          }

          // Check temperature (should be <= -15°C)
          if (finalTemp > -15) {
            calculatedStatus = "FAIL";
          }

          // Check foreign matter
          if (finalForeignMatter === true) {
            calculatedStatus = "FAIL";
          }

          // Check odour and appearance
          if (
            finalOdourStatus === "UNACCEPTABLE" ||
            finalAppearanceStatus === "POOR"
          ) {
            calculatedStatus = "FAIL";
          }

          updates.status = calculatedStatus;
          console.log(
            `[QA] Auto-calculated status: ${calculatedStatus} (broken_pct: ${finalBrokenPercent}, temp: ${finalTemp}, foreign_matter: ${finalForeignMatter}, odour: ${finalOdourStatus}, appearance: ${finalAppearanceStatus})`,
          );
        } else {
          // Only ON_HOLD status is preserved without recalculation
          updates.status = status;
          console.log(`[QA] Preserving ON_HOLD status`);
        }

        await qa.update(updates);

        return reply.code(200).send({
          statusCode: 200,
          message: "QA record updated successfully",
          data: qa,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });

  // ======================= DELETE QA RECORD =======================
  fastify.delete("/:qa_id", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { qa_id } = request.params;

        if (!qa_id || !UUID_PATTERN.test(qa_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: `Invalid qa_id format. Expected UUID but got: "${qa_id}"`,
          });
        }

        const qa = await fastify.models.QAChecklist.findByPk(qa_id);
        if (!qa) {
          return reply.code(404).send({
            statusCode: 404,
            message: "QA record not found",
          });
        }

        // Soft delete the record
        await qa.destroy();

        return reply.code(200).send({
          statusCode: 200,
          message: "QA record deleted successfully",
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({
          statusCode: 500,
          message: "Internal server error",
          error: err.message,
        });
      }
    },
  });
};
