import QAChecklist from "../../../models/qa_checklist";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (fastify) => {
  // Create new QA record
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        let {
          batch_no,
          order_id,
          peeling_id,
          species_name,
          product_form,
          quantity,
          status = "PENDING",
          inspection_date,
          inspector_name,
          remarks,
          defects,
          peeled_product_id,
          peeled_dispatch_id,
        } = request.body;
        const profile_id = request.token_profile_id;

        if (!batch_no) {
          return reply.code(400).send({
            statusCode: 400,
            message: "batch_no is required",
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

        // if caller didn't supply an order, attempt to infer it from the
        // peeled product/dispatch or peeling record so that the trace is
        // preserved even for manual QA entries
        if (!order_id) {
          if (peeled_dispatch_id) {
            const pd =
              await QAChecklist.sequelize.models.PeeledDispatches.findOne({
                attributes: ["order_id"],
                where: { id: peeled_dispatch_id, is_active: true },
                raw: true,
              });
            if (pd && pd.order_id) order_id = pd.order_id;
          }
          if (!order_id && peeled_product_id) {
            const pd2 =
              await QAChecklist.sequelize.models.PeeledDispatches.findOne({
                attributes: ["order_id"],
                where: { peeled_product_id, is_active: true },
                raw: true,
              });
            if (pd2 && pd2.order_id) order_id = pd2.order_id;
          }
          if (!order_id && peeling_id) {
            const p = await QAChecklist.sequelize.models.Peeling.findOne({
              attributes: ["order_id"],
              where: { id: peeling_id, is_active: true },
              raw: true,
            });
            if (p && p.order_id) order_id = p.order_id;
          }
        }

        // Create QA record
        let qa;
        try {
          qa = await QAChecklist.create({
            batch_no,
            order_id: order_id || null,
            peeling_id: peeling_id || null,
            peeled_product_id: peeled_product_id || null,
            peeled_dispatch_id: peeled_dispatch_id || null,
            species_name,
            product_form,
            quantity: quantity ? parseFloat(quantity) : null,
            status,
            inspection_date: inspection_date ? new Date(inspection_date) : null,
            inspector_name,
            remarks,
            defects,
            created_by: profile_id,
          });
          // Update related peeled dispatch so it knows this QA record
          if (peeled_dispatch_id) {
            try {
              await fastify.models.PeeledDispatches.update(
                {
                  qa_checklist_id: qa.id,
                },
                { where: { id: peeled_dispatch_id, is_active: true } },
              );
            } catch (err) {
              fastify.log.error(
                `[QA] unable to link QA ${qa.id} to peeled dispatch ${peeled_dispatch_id}: ${err.message}`,
              );
            }
          }
        } catch (createErr) {
          // if the database hasn't been migrated yet, some of the
          // attributes we attempted to insert may not exist.  strip them
          // and try again to avoid crashing the request.
          if (
            createErr?.parent?.code === "42703" &&
            /column .* does not exist/.test(createErr.parent.message)
          ) {
            fastify.log.warn(
              "QA create: missing column, retrying without unsupported fields",
            );
            const safePayload = {
              batch_no,
              order_id: order_id || null,
              peeling_id: peeling_id || null,
              species_name,
              product_form,
              quantity: quantity ? parseFloat(quantity) : null,
              status,
              inspection_date: inspection_date
                ? new Date(inspection_date)
                : null,
              inspector_name,
              remarks,
              defects,
              created_by: profile_id,
            };
            qa = await QAChecklist.create(safePayload);
          } else {
            throw createErr;
          }
        }

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
};
