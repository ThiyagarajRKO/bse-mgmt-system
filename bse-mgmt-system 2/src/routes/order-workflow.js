/**
 * Order Workflow Routes
 * Serves the order workflow management interface
 */

export default async (fastify) => {
  // Render order workflow page
  fastify.get("/order-workflow", async (request, reply) => {
    try {
      // Check authentication
      if (!request.session?.user_id) {
        return reply.redirect("/login");
      }

      // Check if order_id parameter is present - redirect to Production
      const orderId = request.query.order_id;
      if (orderId) {
        return reply.redirect(`/Production?order_id=${orderId}`);
      }

      // Render the OrderWorkflow template (for general workflow management)
      return reply.view("OrderWorkflow.ejs", {
        user: request.session,
        pageTitle: "Order Workflow Management",
        breadcrumb: [
          { label: "Dashboard", url: "/" },
          { label: "Order Workflow", url: "/order-workflow", active: true },
        ],
      });
    } catch (error) {
      fastify.log.error("Error rendering order workflow page:", error);
      return reply.status(500).send({
        statusCode: 500,
        message: "Error loading order workflow page",
        error: error.message,
      });
    }
  });

  // API endpoint to get order statistics for dashboard
  fastify.get(
    "/api/v1/order-workflow/stats",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { Order, Allocation, Production, QA, Traceability } =
          fastify.sequelize.models;

        const [
          totalOrders,
          draftOrders,
          confirmedOrders,
          allocations,
          productions,
          qaRecords,
          cartons,
        ] = await Promise.all([
          Order.count(),
          Order.count({ where: { status: "DRAFT" } }),
          Order.count({ where: { status: "CONFIRMED" } }),
          Allocation.count(),
          Production.count(),
          QA.count(),
          Traceability.count(),
        ]);

        return reply.send({
          statusCode: 200,
          message: "Order workflow statistics retrieved successfully",
          data: {
            orders: {
              total: totalOrders,
              draft: draftOrders,
              confirmed: confirmedOrders,
            },
            allocations,
            productions,
            qaRecords,
            cartons,
          },
        });
      } catch (error) {
        fastify.log.error("Error fetching workflow stats:", error);
        return reply.status(500).send({
          statusCode: 500,
          message: "Error fetching workflow statistics",
          error: error.message,
        });
      }
    },
  );

  // API endpoint to get order timeline/history
  fastify.get(
    "/api/v1/order-workflow/:orderId/timeline",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { orderId } = request.params;
        const { Order, Allocation, Production, QA, Traceability, AuditLog } =
          fastify.sequelize.models;

        // Get order
        const order = await Order.findByPk(orderId);
        if (!order) {
          return reply.status(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        // Build timeline
        const timeline = [];

        // Order creation
        timeline.push({
          stage: "Order Created",
          timestamp: order.createdAt,
          status: "DRAFT",
          details: `Order ${order.order_id} created`,
        });

        // Order confirmation
        if (order.status !== "DRAFT") {
          timeline.push({
            stage: "Order Confirmed",
            timestamp: order.updatedAt,
            status: "CONFIRMED",
            details: `Order ${order.order_id} confirmed`,
          });
        }

        // Get allocation
        const allocation = await Allocation.findOne({
          where: { order_id: orderId },
        });

        if (allocation) {
          timeline.push({
            stage: "Inventory Allocated",
            timestamp: allocation.createdAt,
            status: "ALLOCATED",
            details: `${allocation.quantity} units allocated`,
          });

          // Get production
          const production = await Production.findOne({
            where: { allocation_id: allocation.id },
          });

          if (production) {
            timeline.push({
              stage: "Production Started",
              timestamp: production.createdAt,
              status: "IN_PRODUCTION",
              details: `Batch ${production.batch_id} started`,
            });

            // Get QA
            const qa = await QA.findOne({
              where: { batch_id: production.id },
            });

            if (qa) {
              timeline.push({
                stage: "Quality Assurance",
                timestamp: qa.createdAt,
                status: qa.test_result,
                details: `QA test result: ${qa.test_result}`,
              });

              // Get traceability
              const carton = await Traceability.findOne({
                where: { batch_id: production.id },
              });

              if (carton) {
                timeline.push({
                  stage: "Carton Sealed",
                  timestamp: carton.createdAt,
                  status: "SEALED",
                  details: `Carton ${carton.carton_id} sealed`,
                });
              }
            }
          }
        }

        // Sort by timestamp
        timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return reply.send({
          statusCode: 200,
          message: "Order timeline retrieved successfully",
          data: {
            order_id: order.order_id,
            timeline,
          },
        });
      } catch (error) {
        fastify.log.error("Error fetching order timeline:", error);
        return reply.status(500).send({
          statusCode: 500,
          message: "Error fetching order timeline",
          error: error.message,
        });
      }
    },
  );
};
