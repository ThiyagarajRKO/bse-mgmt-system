/**
 * OrderTrackingService
 *
 * Manages order status tracking throughout the entire fulfillment lifecycle.
 * Updates order_status based on production, dispatch, peeling, and shipment progress.
 *
 * STATUS FLOW:
 * DRAFT → CONFIRMED → ALLOCATED → IN_PRODUCTION → PRODUCTION_COMPLETE
 * → DISPATCHED → PEELING_IN_PROGRESS → READY_FOR_SHIPMENT → SHIPPED → DELIVERED
 */

class OrderTrackingService {
  /**
   * Helper to get models - either from parameter or require fresh
   */
  getModels(fastifyOrModels) {
    if (fastifyOrModels?.models) {
      return fastifyOrModels.models;
    }
    if (fastifyOrModels?.Orders) {
      return fastifyOrModels;
    }
    // Fallback: require fresh - models should be initialized by now
    return require("../../models/index.js");
  }

  /**
   * Calculate current order stage based on production/dispatch/peeling data
   *
   * @param {UUID} orderId - Order ID to check
   * @param {Object} fastifyOrModels - Fastify instance or models (optional)
   * @returns {Object} Current stage with details
   *   {
   *     current_stage: string,
   *     order_status: string,
   *     progress_percentage: number,
   *     details: object,
   *     next_stage: string
   *   }
   */
  async calculateOrderProgress(orderId, fastifyOrModels) {
    try {
      console.log(`[OrderTracking] Calculating progress for order: ${orderId}`);

      // Get models
      const models = this.getModels(fastifyOrModels);

      // Ensure models are loaded
      if (!models || !models.Orders) {
        console.warn(
          "[OrderTracking] Models not loaded, skipping progress calculation",
        );
        return {
          current_stage: "PENDING",
          order_status: "UNKNOWN",
          progress_percentage: 0,
          details: {
            message: "Unable to calculate progress - models not loaded",
          },
          next_stage: "UNKNOWN",
        };
      }

      // Get order (only query columns that actually exist)
      const order = await models.Orders.findByPk(orderId, {
        attributes: [
          "id",
          "order_no",
          "order_status",
          "delivery_status",
          "created_at",
        ],
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Stage 1: Check if order confirmed
      if (
        !order.order_status ||
        order.order_status === "DRAFT" ||
        !order.order_status.startsWith("CONFIRM")
      ) {
        return {
          current_stage: "PENDING_CONFIRMATION",
          order_status: order.order_status || "DRAFT",
          progress_percentage: 0,
          details: {
            message: "Order not yet confirmed",
            created_at: order.created_at,
          },
          next_stage: "CONFIRMED",
        };
      }

      // Stage 2: Check if stock has been allocated (via SalesAllocation)
      // BUT: If order is already in delivery (In Transit, Shipped, Delivered), it must have been allocated
      const hasDeliveryStatus =
        order.delivery_status && order.delivery_status !== "Pending";
      const isInOrBeyondDelivery =
        hasDeliveryStatus &&
        (order.delivery_status.includes("Transit") ||
          order.delivery_status.includes("Shipped") ||
          order.delivery_status.includes("Delivered"));

      let allocations = [];
      if (models.SalesAllocation) {
        try {
          allocations = await models.SalesAllocation.findAll({
            where: { order_id: orderId, allocation_status: "ALLOCATED" },
            attributes: ["id"],
            limit: 1,
            raw: true,
          });
        } catch (err) {
          console.warn(
            `[OrderTracking] Could not check allocations: ${err.message}`,
          );
          allocations = [];
        }
      } else {
        console.warn("[OrderTracking] SalesAllocation model not found");
      }

      // If no explicit ALLOCATED record BUT order is already in delivery, assume it was allocated
      const hasAllocation =
        (allocations && allocations.length > 0) || isInOrBeyondDelivery;

      if (!hasAllocation) {
        console.log(
          `[OrderTracking] No allocation found and not in delivery for ${orderId}`,
        );
        return {
          current_stage: "AWAITING_ALLOCATION",
          order_status: order.order_status,
          progress_percentage: 5,
          details: {
            message: "Order awaiting stock allocation",
          },
          next_stage: "ALLOCATED",
        };
      }

      console.log(
        `[OrderTracking] ✅ Allocation confirmed (explicit or via delivery status)`,
      );

      // Stage 3: Check production progress
      // Production might not be directly linked to order_id
      // It goes: Order → SalesAllocation → ProductionSchedule → BatchMaster
      let productionOrders = [];
      let productionViaAllocation = [];

      if (models.production_orders) {
        try {
          productionOrders = await models.production_orders.findAll({
            where: { order_id: orderId },
            attributes: [
              "id",
              "status",
              "planned_quantity_kg",
              "produced_quantity_kg",
              "created_at",
              "updated_at",
            ],
            raw: true,
          });
          console.log(
            `[OrderTracking] Found ${productionOrders.length} production_orders for order ${orderId}`,
          );
        } catch (err) {
          console.warn(
            `[OrderTracking] Could not fetch production_orders: ${err.message}`,
          );
        }
      } else {
        console.warn("[OrderTracking] production_orders model not found");
      }

      // If no direct production_orders, check through allocation → ProductionSchedule → BatchMaster
      if (
        productionOrders.length === 0 &&
        models.SalesAllocation &&
        models.ProductionSchedule
      ) {
        try {
          const allocations = await models.SalesAllocation.findAll({
            where: { order_id: orderId },
            attributes: ["id"],
            raw: true,
          });
          console.log(
            `[OrderTracking] Found ${allocations.length} allocations for order ${orderId}`,
          );

          if (allocations.length > 0) {
            const allocationIds = allocations.map((a) => a.id);
            productionViaAllocation = await models.ProductionSchedule.findAll({
              where: { allocation_id: allocationIds },
              attributes: ["id", "production_status", "assigned_to"],
              raw: true,
            });
            console.log(
              `[OrderTracking] Found ${productionViaAllocation.length} production schedules via allocations`,
            );
          }
        } catch (err) {
          console.warn(
            `[OrderTracking] Could not check production via allocation: ${err.message}`,
          );
        }
      }

      // Check if we have any production data (either direct or via allocation)
      const hasProduction =
        productionOrders.length > 0 || productionViaAllocation.length > 0;

      if (!hasProduction) {
        // No production orders or schedules yet - but check delivery status as indicator
        const hasDeliveryStatus =
          order.delivery_status && order.delivery_status !== "Pending";

        // Infer production completion from delivery status
        // "In Transit" = already being shipped = production complete
        // "Shipped", "Delivered" = definitely complete
        const isInTransitOrBeyond =
          order.delivery_status &&
          (order.delivery_status.includes("Transit") ||
            order.delivery_status.includes("Shipped") ||
            order.delivery_status.includes("Delivered"));

        console.log(
          `[OrderTracking] Stage detection: hasDelivery=${hasDeliveryStatus}, isInTransit=${isInTransitOrBeyond}, status=${order.delivery_status}, hasProduction=${hasProduction}`,
        );

        if (isInTransitOrBeyond) {
          // Order is already in transit/shipped/delivered = production is complete
          // Check if there's peeling data (product processing stage)
          let peelingRecords = [];
          if (models.peeling) {
            try {
              peelingRecords = await models.peeling.findAll({
                where: { order_id: orderId },
                attributes: ["id", "peeling_status"],
                raw: true,
              });
              console.log(
                `[OrderTracking] Found ${peelingRecords.length} peeling records`,
              );
            } catch (err) {
              console.warn(
                `[OrderTracking] Could not check peeling: ${err.message}`,
              );
            }
          }

          if (peelingRecords.length > 0) {
            // In peeling/processing stage - but check if packing is done
            console.log(
              `[OrderTracking] ✅ Peeling in progress - ${peelingRecords.length} records`,
            );

            // Check if packing is already done (packing records exist)
            let packingRecords = [];
            if (models.Packing) {
              try {
                // Get packing records linked to peeled dispatches of this order
                packingRecords = await models.Packing.findAll({
                  include: [
                    {
                      model: models.PeeledDispatches,
                      as: "pd",
                      where: { order_id: orderId },
                      attributes: ["id"],
                    },
                  ],
                  attributes: ["id"],
                  limit: 1,
                  raw: true,
                });
                console.log(
                  `[OrderTracking] Found ${packingRecords.length} packing records for order`,
                );
              } catch (err) {
                console.warn(
                  `[OrderTracking] Could not check packing: ${err.message}`,
                );
              }
            }

            // If packing records exist, order has progressed past peeling
            if (packingRecords.length > 0) {
              console.log(
                `[OrderTracking] ✅ Packing in progress - ${packingRecords.length} records`,
              );
              return {
                current_stage: "PACKED",
                order_status: "PACKED",
                progress_percentage: 70,
                details: {
                  message: "Product in packing stage",
                  delivery_status: order.delivery_status,
                  packing_records: packingRecords.length,
                },
                next_stage: "READY_FOR_DISPATCH",
              };
            }

            // Check if peeling is completed
            const peelingStatus = peelingRecords[0]?.peeling_status;
            if (peelingStatus === "Completed") {
              return {
                current_stage: "PRODUCTION_COMPLETE",
                order_status: "PRODUCTION_COMPLETE",
                progress_percentage: 50,
                details: {
                  message: "Production and peeling complete, awaiting packing",
                  delivery_status: order.delivery_status,
                  peeling_records: peelingRecords.length,
                },
                next_stage: "QA_APPROVED",
              };
            }

            // Peeling is in progress
            return {
              current_stage: "PEELING_IN_PROGRESS",
              order_status: "PEELING_IN_PROGRESS",
              progress_percentage: 40,
              details: {
                message: "Product in peeling/processing stage",
                delivery_status: order.delivery_status,
                peeling_records: peelingRecords.length,
              },
              next_stage: "PRODUCTION_COMPLETE",
            };
          }

          console.log(
            `[OrderTracking] No peeling records, checking peeled_dispatches...`,
          );
          // Check for peeled dispatches (final stage)
          let peeledDispatches = [];
          if (models.peeled_dispatches) {
            try {
              peeledDispatches = await models.peeled_dispatches.findAll({
                where: { order_id: orderId },
                attributes: ["id"],
                limit: 1,
                raw: true,
              });
              console.log(
                `[OrderTracking] Found ${peeledDispatches.length} peeled_dispatch records`,
              );
            } catch (err) {
              console.warn(
                `[OrderTracking] Could not check peeled_dispatches: ${err.message}`,
              );
            }
          }

          if (peeledDispatches.length > 0) {
            // Peeled dispatches exist - check if packing is done
            console.log(
              `[OrderTracking] ✅ Found ${peeledDispatches.length} peeled_dispatch records`,
            );

            // Check if packing records exist for these peeled dispatches
            let packingRecords = [];
            if (models.Packing) {
              try {
                packingRecords = await models.Packing.findAll({
                  include: [
                    {
                      model: models.PeeledDispatches,
                      as: "pd",
                      where: { order_id: orderId },
                      attributes: ["id"],
                    },
                  ],
                  attributes: ["id"],
                  limit: 1,
                  raw: true,
                });
                console.log(
                  `[OrderTracking] Found ${packingRecords.length} packing records`,
                );
              } catch (err) {
                console.warn(
                  `[OrderTracking] Could not check packing: ${err.message}`,
                );
              }
            }

            // If packing records exist, order has progressed past peeling
            if (packingRecords.length > 0) {
              console.log(
                `[OrderTracking] ✅ Packing in progress - ${packingRecords.length} records`,
              );
              return {
                current_stage: "PACKED",
                order_status: "PACKED",
                progress_percentage: 70,
                details: {
                  message: "Product in packing stage",
                  delivery_status: order.delivery_status,
                  packing_records: packingRecords.length,
                },
                next_stage: "READY_FOR_DISPATCH",
              };
            }

            // Ready for shipment / shipping (peeled dispatches but no packing yet)
            console.log(
              `[OrderTracking] ✅ Ready for shipment - peeled_dispatches found`,
            );
            return {
              current_stage: "READY_FOR_SHIPMENT",
              order_status: "READY_FOR_SHIPMENT",
              progress_percentage: 75,
              details: {
                message: "Product ready and shipping",
                delivery_status: order.delivery_status,
              },
              next_stage: "SHIPPED",
            };
          }

          // In transit but no peeling/dispatch data - likely dispatched for processing
          let dispatches = [];
          if (models.dispatches) {
            try {
              dispatches = await models.dispatches.findAll({
                where: { order_id: orderId },
                attributes: ["id"],
                limit: 1,
                raw: true,
              });
              console.log(
                `[OrderTracking] Found ${dispatches.length} dispatch records`,
              );
            } catch (err) {
              console.warn(
                `[OrderTracking] Could not check dispatches: ${err.message}`,
              );
            }
          }

          if (
            dispatches.length > 0 ||
            order.delivery_status.includes("Transit")
          ) {
            // Determine stage based on delivery status specificity
            // If it's just "In Transit", assume it's in final stages (60-80%)
            // This indicates: production done → dispatch done → processing done → shipping

            let stage = "PEELING_IN_PROGRESS";
            let progress = 60;
            let message = "Product in transit for final processing/delivery";

            if (order.delivery_status.includes("Shipped")) {
              stage = "SHIPPED";
              progress = 85;
              message = "Order shipped";
            } else if (order.delivery_status.includes("Delivered")) {
              stage = "DELIVERED";
              progress = 100;
              message = "Order delivered";
            } else if (order.delivery_status.includes("Ready")) {
              stage = "READY_FOR_SHIPMENT";
              progress = 75;
              message = "Order ready for final shipment";
            }

            console.log(
              `[OrderTracking] ✅ In transit - returning ${stage} at ${progress}%`,
            );
            return {
              current_stage: stage,
              order_status: stage,
              progress_percentage: progress,
              details: {
                message: message,
                delivery_status: order.delivery_status,
              },
              next_stage: stage === "DELIVERED" ? "COMPLETED" : "SHIPPED",
            };
          }
        }

        if (hasDeliveryStatus) {
          // Has delivery status but not in transit yet
          return {
            current_stage: "IN_PRODUCTION",
            order_status: "IN_PRODUCTION",
            progress_percentage: 25,
            details: {
              message: "Production in progress",
              delivery_status: order.delivery_status,
            },
            next_stage: "PRODUCTION_COMPLETE",
          };
        }

        // No production orders, outputs, or delivery status yet
        return {
          current_stage: "AWAITING_PRODUCTION",
          order_status: "ALLOCATED",
          progress_percentage: 10,
          details: {
            message: "Stock allocated, awaiting production",
          },
          next_stage: "IN_PRODUCTION",
        };
      }

      // Use production data from either source
      const productionDataSource =
        productionOrders.length > 0
          ? productionOrders
          : productionViaAllocation;
      const isFromSchedule = productionOrders.length === 0;
      const productionStatus =
        productionDataSource[0]?.[
          isFromSchedule ? "production_status" : "status"
        ] || "IN_PROGRESS";
      const totalProduced = productionDataSource.reduce(
        (sum, po) => sum + (parseFloat(po.produced_quantity_kg) || 0),
        0,
      );

      if (
        productionStatus === "PLANNED" ||
        productionStatus === "IN_PROGRESS"
      ) {
        return {
          current_stage: "IN_PRODUCTION",
          order_status: "IN_PRODUCTION",
          progress_percentage: 25,
          details: {
            message: "Production in progress",
            production_orders_count: productionOrders.length,
            quantity_produced_kg: totalProduced,
            status: productionStatus,
          },
          next_stage: "PRODUCTION_COMPLETE",
        };
      }

      if (productionStatus === "COMPLETED") {
        // Stage 4: Check dispatch progress
        let dispatches = [];
        if (models.dispatches) {
          try {
            dispatches = await models.dispatches.findAll({
              where: { order_id: orderId },
              attributes: [
                "id",
                "status",
                "dispatch_quantity_kg",
                "created_at",
                "updated_at",
              ],
              raw: true,
            });
          } catch (err) {
            console.warn(
              `[OrderTracking] Could not fetch dispatches: ${err.message}`,
            );
          }
        }

        if (dispatches.length === 0) {
          return {
            current_stage: "PRODUCTION_COMPLETE",
            order_status: "PRODUCTION_COMPLETE",
            progress_percentage: 40,
            details: {
              message: "Production complete, awaiting dispatch",
              total_produced_kg: totalProduced,
            },
            next_stage: "DISPATCHED",
          };
        }

        const dispatchedQty = dispatches.reduce(
          (sum, d) => sum + (parseFloat(d.dispatch_quantity_kg) || 0),
          0,
        );
        const dispatchStatus = dispatches[0].status;

        if (
          dispatchStatus === "PENDING" ||
          dispatchStatus === "PARTIAL" ||
          dispatchStatus === "IN_PROGRESS"
        ) {
          return {
            current_stage: "DISPATCHED",
            order_status: "DISPATCHED",
            progress_percentage: 50,
            details: {
              message: "Production dispatched for processing",
              dispatch_orders_count: dispatches.length,
              quantity_dispatched_kg: dispatchedQty,
              status: dispatchStatus,
            },
            next_stage: "PEELING_IN_PROGRESS",
          };
        }

        if (dispatchStatus === "COMPLETED") {
          // Stage 5: Check peeling progress
          let peelingRecords = [];
          if (models.peeling) {
            try {
              peelingRecords = await models.peeling.findAll({
                where: { order_id: orderId },
                attributes: [
                  "id",
                  "peeling_status",
                  "peeling_quantity",
                  "yield_quantity",
                  "created_at",
                  "updated_at",
                ],
                raw: true,
              });
            } catch (err) {
              console.warn(
                `[OrderTracking] Could not fetch peeling: ${err.message}`,
              );
            }
          }

          if (peelingRecords.length === 0) {
            return {
              current_stage: "DISPATCH_COMPLETE",
              order_status: "DISPATCHED",
              progress_percentage: 55,
              details: {
                message: "Dispatch complete, awaiting peeling",
                total_dispatched_kg: dispatchedQty,
              },
              next_stage: "PEELING_IN_PROGRESS",
            };
          }

          const peelingStatus = peelingRecords[0].peeling_status;
          const totalPeeledQty = peelingRecords.reduce(
            (sum, p) => sum + (parseFloat(p.yield_quantity) || 0),
            0,
          );

          if (peelingStatus !== "Completed") {
            return {
              current_stage: "PEELING_IN_PROGRESS",
              order_status: "PEELING_IN_PROGRESS",
              progress_percentage: 65,
              details: {
                message: "Peeling in progress",
                peeling_records_count: peelingRecords.length,
                quantity_peeled_kg: totalPeeledQty,
                status: peelingStatus,
              },
              next_stage: "PEELING_COMPLETE",
            };
          }

          if (peelingStatus === "Completed") {
            // Stage 6: Check peeled dispatch
            let peeledDispatches = [];
            if (models.peeled_dispatches) {
              try {
                peeledDispatches = await models.peeled_dispatches.findAll({
                  where: { order_id: orderId },
                  attributes: [
                    "id",
                    "status",
                    "peeled_dispatch_quantity_kg",
                    "created_at",
                    "updated_at",
                  ],
                  raw: true,
                });
              } catch (err) {
                console.warn(
                  `[OrderTracking] Could not fetch peeled_dispatches: ${err.message}`,
                );
              }
            }

            if (peeledDispatches.length === 0) {
              return {
                current_stage: "PEELING_COMPLETE",
                order_status: "READY_FOR_SHIPMENT",
                progress_percentage: 75,
                details: {
                  message: "Peeling complete, ready for shipment",
                  total_peeled_kg: totalPeeledQty,
                },
                next_stage: "READY_FOR_SHIPMENT",
              };
            }

            const peeledDispatchStatus = peeledDispatches[0].status;
            const totalPeeledDispatched = peeledDispatches.reduce(
              (sum, pd) =>
                sum + (parseFloat(pd.peeled_dispatch_quantity_kg) || 0),
              0,
            );

            if (
              peeledDispatchStatus === "PENDING" ||
              peeledDispatchStatus === "IN_PROGRESS"
            ) {
              return {
                current_stage: "READY_FOR_SHIPMENT",
                order_status: "READY_FOR_SHIPMENT",
                progress_percentage: 80,
                details: {
                  message: "Final products ready for shipment",
                  peeled_dispatch_count: peeledDispatches.length,
                  quantity_ready_kg: totalPeeledDispatched,
                  status: peeledDispatchStatus,
                },
                next_stage: "SHIPPED",
              };
            }

            if (peeledDispatchStatus === "COMPLETED") {
              return {
                current_stage: "SHIPPED",
                order_status: "SHIPPED",
                progress_percentage: 95,
                details: {
                  message: "Order shipped to customer",
                  total_shipped_kg: totalPeeledDispatched,
                  delivery_status: order.delivery_status,
                },
                next_stage: "DELIVERED",
              };
            }
          }
        }
      }

      // Default: Return current status
      return {
        current_stage: "IN_PROGRESS",
        order_status: order.order_status,
        progress_percentage: 50,
        details: {
          message: "Order in progress",
          order_status: order.order_status,
        },
        next_stage: "NEXT_STAGE",
      };
    } catch (error) {
      console.error(
        `[OrderTracking] Error calculating progress: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update order status based on current progress
   *
   * @param {UUID} orderId - Order ID to update
   * @param {string} newStatus - New status to set
   * @param {Object} metadata - Additional info (reason, triggered_by, etc)
   * @param {Object} fastifyOrModels - Fastify instance or models (optional)
   * @returns {Object} Updated order with tracking info
   */
  async updateOrderStatus(orderId, newStatus, metadata = {}, fastifyOrModels) {
    try {
      console.log(
        `[OrderTracking] Updating order ${orderId} status to: ${newStatus}`,
      );

      // Get models
      const models = this.getModels(fastifyOrModels);

      const order = await models.Orders.findByPk(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const oldStatus = order.order_status;

      // Update order status
      await order.update({
        order_status: newStatus,
        updated_at: new Date(),
      });

      // Log status transition (if OrderStatusLog exists)
      if (models.OrderStatusLog) {
        try {
          await models.OrderStatusLog.create({
            order_id: orderId,
            from_status: oldStatus,
            to_status: newStatus,
            transition_date: new Date(),
            transition_reason: metadata.reason || "Automatic status update",
            metadata: JSON.stringify(metadata || {}),
            is_active: true,
            created_by: metadata.triggered_by || "system",
          });

          console.log(
            `✅ Status transition logged: ${oldStatus} → ${newStatus}`,
          );
        } catch (logError) {
          console.warn(
            `[OrderTracking] Could not log status transition: ${logError.message}`,
          );
        }
      }

      console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);

      return {
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        updated_at: order.updated_at,
        metadata,
      };
    } catch (error) {
      console.error(
        `[OrderTracking] Error updating order status: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Automatically update order status based on calculated progress
   * Call this when any production/dispatch/peeling event completes
   *
   * @param {UUID} orderId - Order ID to check and update
   * @param {Object} fastifyOrModels - Fastify instance or models (optional)
   * @returns {Object} Progress info and whether status changed
   */
  async syncOrderStatus(orderId, fastifyOrModels) {
    try {
      console.log(`[OrderTracking] Syncing order status for: ${orderId}`);

      // Get models
      const models = this.getModels(fastifyOrModels);

      // Calculate current progress
      const progress = await this.calculateOrderProgress(orderId, models);
      console.log(`[OrderTracking] Calculated progress:`, progress);

      // Get current order status
      const order = await models.Orders.findByPk(orderId, {
        attributes: ["id", "order_status"],
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Update if status changed
      let statusChanged = false;
      let updateResult = null;

      if (order.order_status !== progress.order_status) {
        statusChanged = true;
        updateResult = await this.updateOrderStatus(
          orderId,
          progress.order_status,
          {
            reason: `Auto-sync: ${progress.details?.message || "Status update"}`,
            triggered_by: "OrderTrackingService.syncOrderStatus",
            previous_stage: order.order_status,
            new_stage: progress.current_stage,
          },
          models,
        );
      }

      return {
        order_id: orderId,
        status_changed: statusChanged,
        previous_status: order.order_status,
        current_progress: progress,
        update_result: updateResult,
      };
    } catch (error) {
      console.error(
        `[OrderTracking] Error syncing order status: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get complete order tracking information
   * Used by tracking API endpoint
   *
   * @param {UUID} orderId - Order ID
   * @param {Object} fastifyOrModels - Fastify instance or models (optional)
   * @returns {Object} Complete tracking info
   */
  async getOrderTracking(orderId, fastifyOrModels) {
    try {
      // Get models
      const models = this.getModels(fastifyOrModels);

      // Ensure models are loaded
      if (!models || !models.Orders) {
        throw new Error(
          "Models not initialized - database connection may not be ready",
        );
      }

      const order = await models.Orders.findByPk(orderId, {
        attributes: [
          "id",
          "order_no",
          "order_status",
          "delivery_status",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["customer_name", "customer_email", "customer_phone"],
          },
        ],
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Get status timeline
      const statusTimeline = await models.OrderStatusLog.findAll({
        where: { order_id: orderId },
        attributes: [
          "id",
          "from_status",
          "to_status",
          "transition_date",
          "transition_reason",
          "created_at",
        ],
        order: [["created_at", "ASC"]],
      }).catch(() => []);

      // Calculate current progress
      const progress = await this.calculateOrderProgress(orderId, models);

      // Update order_status in the order object to match the current_stage from progress
      const orderData = {
        ...order.dataValues,
        order_status: progress.order_status, // Use the calculated order_status from progress
      };

      // Get the last logged status from the timeline
      const lastLoggedStatus =
        statusTimeline.length > 0
          ? statusTimeline[statusTimeline.length - 1].to_status
          : "DRAFT";

      // Build the timeline data
      let timelineData = statusTimeline.map((log) => log.dataValues);

      // Map all possible order statuses in sequence
      const statusSequence = [
        "DRAFT",
        "CONFIRMED",
        "ALLOCATED",
        "IN_PRODUCTION",
        "PRODUCTION_COMPLETE",
        "PEELING_IN_PROGRESS",
        "PACKED",
        "READY_FOR_DISPATCH",
        "READY_FOR_SHIPMENT",
        "DISPATCHED",
        "SHIPPED",
        "DELIVERED",
      ];

      // Find the index of the last logged status
      const lastLoggedIndex = statusSequence.indexOf(lastLoggedStatus);
      const currentStatusIndex = statusSequence.indexOf(progress.order_status);

      // If there are intermediate statuses between the last logged and current status,
      // add them to the timeline (with calculated transition dates)
      if (
        currentStatusIndex > lastLoggedIndex &&
        progress.order_status !== lastLoggedStatus
      ) {
        console.log(
          `[OrderTracking] Building intermediate transitions from ${lastLoggedStatus} to ${progress.order_status}`,
        );

        // Get the timestamp of the last logged transition
        const lastTransitionTime =
          statusTimeline.length > 0
            ? new Date(
                statusTimeline[statusTimeline.length - 1].transition_date,
              )
            : new Date(order.created_at);

        // Calculate intermediate transitions
        for (let i = lastLoggedIndex + 1; i <= currentStatusIndex; i++) {
          const fromStatus = statusSequence[i - 1];
          const toStatus = statusSequence[i];

          // Calculate transition time (spread them over time or use current time)
          const transitionTime = new Date(
            lastTransitionTime.getTime() +
              (i - lastLoggedIndex) * 60 * 60 * 1000,
          ); // 1 hour apart

          console.log(
            `[OrderTracking] Adding transition: ${fromStatus} → ${toStatus}`,
          );

          timelineData.push({
            id: null, // Virtual entry
            from_status: fromStatus,
            to_status: toStatus,
            transition_date: transitionTime.toISOString(),
            transition_reason: `Calculated from production progress - Order progressing through ${toStatus} stage`,
            created_at: transitionTime.toISOString(),
          });
        }
      } else if (
        progress.order_status &&
        progress.order_status !== lastLoggedStatus
      ) {
        // Direct transition if no intermediate statuses
        console.log(
          `[OrderTracking] Adding direct transition: ${lastLoggedStatus} → ${progress.order_status}`,
        );
        timelineData.push({
          id: null, // Virtual entry
          from_status: lastLoggedStatus,
          to_status: progress.order_status,
          transition_date: new Date().toISOString(),
          transition_reason: `Calculated from production progress - ${progress.details?.message || "In progress"}`,
          created_at: new Date().toISOString(),
        });
      }

      return {
        order: orderData,
        current_progress: progress,
        status_timeline: timelineData,
        summary: {
          total_transitions: timelineData.length,
          first_status_change: timelineData[0]?.transition_date || null,
          last_status_change:
            timelineData[timelineData.length - 1]?.transition_date || null,
          days_in_current_status: this._calculateDaysSince(
            timelineData[timelineData.length - 1]?.created_at ||
              order.created_at,
          ),
        },
      };
    } catch (error) {
      console.error(
        `[OrderTracking] Error getting order tracking: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Helper: Calculate days since a date
   */
  _calculateDaysSince(date) {
    const days = Math.floor(
      (new Date() - new Date(date)) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, days);
  }
}

module.exports = new OrderTrackingService();
