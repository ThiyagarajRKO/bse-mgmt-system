import models from "../../models";
import { Op } from "sequelize";
// const { CheckInventory } = require("../../routes/orders/handlers/check_inventory");

// Import the createPurchaseRequest helper function
const createPurchaseRequest = async (
  productId,
  shortageQuantity,
  session,
  fastify,
) => {
  const models = require("../../models");

  try {
    // Get product details
    const product = await models.ProductMaster.findOne({
      where: { id: productId, is_active: true },
      attributes: ["id", "product_name"],
    });

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Get species information from product
    const productWithSpecies = await models.ProductMaster.findOne({
      where: { id: productId, is_active: true },
      include: [
        {
          model: models.SpeciesMaster,
          as: "SpeciesMaster",
          attributes: ["id", "species_name"],
          required: false,
        },
      ],
    });

    const speciesId = productWithSpecies?.SpeciesMaster?.id;

    // Use a valid UUID for created_by or default to null if not available
    const createdBy = session?.pid || session?.user_id || null;

    // Create procurement lot
    const lotNo = `AUTO-PROC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const procurementLot = await models.ProcurementLots.create(
      {
        procurement_date: new Date(),
        unit_master_id: "c7608aaa-387d-4fc1-90f5-6815818d4cb3", // Default unit
        is_active: true,
        order_id: null, // Not linked to a specific order yet
      },
      {
        profile_id: createdBy, // Pass created_by as profile_id for the hook
      },
    );

    // Create procurement product
    await models.ProcurementProducts.create(
      {
        procurement_lot_id: procurementLot.id,
        supplier_master_id: "c27c1955-586e-4ccf-a2a5-6d52154798e6", // Default supplier AK
        product_master_id: productId,
        procurement_product_type: "UNPROCESSED",
        procurement_quantity: shortageQuantity,
        procurement_price: 0, // To be set later
        procurement_purchaser: "AUTO-PROCUREMENT", // Default purchaser for auto-generated requests
        order_id: null, // Not linked to a specific order yet
        is_active: true,
      },
      {
        profile_id: createdBy, // Pass created_by as profile_id for the hook
      },
    );

    console.log(
      `✅ Created automatic procurement request: ${lotNo} for ${shortageQuantity}kg of ${product.product_name}`,
    );

    return {
      procurement_lot_id: procurementLot.id,
      lot_no: lotNo,
      product_name: product.product_name,
      quantity: shortageQuantity,
    };
  } catch (error) {
    console.error("Error creating purchase request:", error);
    throw error;
  }
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === "string" && UUID_PATTERN.test(id);

// State transition rules
const VALID_TRANSITIONS = {
  ORDER_RECEIVED: ["CONFIRMED", "CANCELLED"],
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ALLOCATED", "PENDING_PURCHASE", "DRAFT", "CANCELLED"],
  ALLOCATED: ["IN_PRODUCTION", "CONFIRMED", "CANCELLED"],
  PENDING_PURCHASE: ["ALLOCATED", "CONFIRMED", "CANCELLED"],
  IN_PRODUCTION: ["READY_FOR_QA", "ALLOCATED", "CANCELLED"],
  READY_FOR_QA: ["QA_APPROVED", "QA_REJECTED", "IN_PRODUCTION", "CANCELLED"],
  QA_APPROVED: ["PACKED", "READY_FOR_QA", "CANCELLED"],
  PACKED: ["READY_FOR_DISPATCH", "QA_APPROVED", "CANCELLED"],
  READY_FOR_DISPATCH: ["DISPATCHED", "PACKED", "CANCELLED"],
  DISPATCHED: ["INVOICED", "READY_FOR_DISPATCH", "CANCELLED"],
  INVOICED: ["CLOSED", "DISPATCHED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

/**
 * Create new sales order (DRAFT status)
 * Creates order and associated order products
 */
export const Create = async (order_data, profile_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { customer_id, order_items, shipping_address } = order_data;

      // Validate customer_id
      if (!isValidUuid(customer_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid customer_id format",
        });
      }

      // Check customer exists
      const customer = await models.CustomerMaster.findOne({
        where: { id: customer_id, is_active: true },
      });

      if (!customer) {
        return reject({
          statusCode: 404,
          message: "Customer not found",
        });
      }

      // Validate and prepare order products
      const products = [];
      for (let item of order_items) {
        // Support both product_id and packing_id for backward compatibility
        const productId = item.product_id || item.packing_id;

        if (!isValidUuid(productId)) {
          return reject({
            statusCode: 422,
            message: "Invalid product_id or packing_id format in order_items",
          });
        }

        if (!item.quantity || item.quantity <= 0) {
          return reject({
            statusCode: 422,
            message: "quantity must be a positive number",
          });
        }

        // Validate product exists
        const product = await models.ProductMaster.findOne({
          where: { id: productId, is_active: true },
        });

        if (!product) {
          return reject({
            statusCode: 404,
            message: `Product ${productId} not found`,
          });
        }

        products.push({
          product_master_id: productId,
          packing_id: item.packing_id || null,
          quantity: item.quantity,
          unit: item.unit || "KG",
          price: item.price || 0,
          total_price: (item.price || 0) * item.quantity,
          description: item.description || "",
        });
      }

      // Create order with products
      const order = await models.Orders.create(
        {
          customer_master_id: customer_id,
          shipping_address: shipping_address || customer.address,
          order_status: "ORDER_RECEIVED",
          delivery_status: "PENDING",
          is_active: true,
          created_by: profile_id,
        },
        {
          profile_id,
          OrderProducts: products, // Pass products through options for afterCreate hook
        },
      );

      resolve({
        statusCode: 201,
        message: "Order created successfully",
        data: order,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Confirm sales order
 * Transition: DRAFT -> CONFIRMED
 * Triggers: Validate order items, reserve inventory
 */
export const ConfirmOrder = async (profile_id, order_id, confirm_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(order_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Order ID format. Expected valid UUID.",
        });
      }

      // Get order and validate current status
      const order = await models.Orders.findOne({
        where: { id: order_id, is_active: true },
        include: [
          {
            model: models.OrderProducts,
            where: { is_active: true },
          },
        ],
      });

      if (!order) {
        return reject({
          statusCode: 404,
          message: "Order not found",
        });
      }

      if (order.order_status !== "DRAFT") {
        return reject({
          statusCode: 409,
          message: `Order cannot be confirmed from ${order.order_status} status`,
        });
      }

      if (!order.OrderProducts || order.OrderProducts.length === 0) {
        return reject({
          statusCode: 400,
          message: "Order must have at least one product",
        });
      }

      // Update order status
      await order.update(
        {
          order_status: "CONFIRMED",
          confirmation_date: new Date(),
          updated_by: profile_id,
        },
        { profile_id },
      );

      // Log status transition
      await models.OrderStatusLog.create({
        order_id,
        from_status: "DRAFT",
        to_status: "CONFIRMED",
        transition_date: new Date(),
        transition_reason: confirm_data?.remarks || "Order confirmed",
        created_by: profile_id,
      });

      resolve({
        statusCode: 200,
        message: "Order confirmed successfully",
        data: order,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Allocate inventory to order
 * Transition: CONFIRMED -> ALLOCATED
 * Links orders to physical inventory stock
 */
export const AllocateInventory = async (profile_id, allocation_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { order_id, order_product_id, packing_id, allocated_quantity } =
        allocation_data;

      // Validate inputs
      if (!isValidUuid(order_id) || !isValidUuid(packing_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid ID format. Expected valid UUIDs.",
        });
      }

      // Check order exists and is in CONFIRMED status
      const order = await models.Orders.findOne({
        where: { id: order_id, is_active: true },
      });

      if (!order) {
        return reject({ statusCode: 404, message: "Order not found" });
      }

      if (order.order_status !== "CONFIRMED") {
        return reject({
          statusCode: 409,
          message: `Cannot allocate from ${order.order_status} status`,
        });
      }

      // Get order product to get product_master_id for inventory checking
      const orderProduct = await models.OrderProducts.findOne({
        where: {
          id: order_product_id,
          order_id: order_id,
          is_active: true,
        },
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
            required: true,
          },
        ],
      });

      if (!orderProduct) {
        return reject({
          statusCode: 404,
          message: "Order product not found",
        });
      }

      // Check inventory availability and determine next action
      let allocationStatus = "PENDING_PURCHASE"; // Default when insufficient inventory
      let allocationRemarks = "";
      let purchaseRequestCreated = false;

      try {
        const {
          CheckInventory,
        } = require("../../routes/orders/handlers/check_inventory");
        const inventoryCheck = await CheckInventory(
          {
            product_master_id: orderProduct.product_master_id,
            required_quantity: allocated_quantity,
          },
          { pid: profile_id },
          { log: console },
        );

        const finishedGoodsAvailable =
          inventoryCheck?.data?.breakdown?.effective_finished_goods || 0;
        const rawMaterialStock =
          inventoryCheck?.data?.breakdown?.raw_material_stock || 0;
        const alreadyCreatedPurchaseRequest =
          inventoryCheck?.data?.purchase_request_created || false;
        const effectiveAvailableQuantity =
          inventoryCheck?.data?.available_quantity || 0;

        // Determine allocation status based on inventory availability
        if (finishedGoodsAvailable >= allocated_quantity) {
          // Finished goods are available - allocation is complete
          allocationStatus = "ALLOCATED";
          allocationRemarks = `Finished goods available (${finishedGoodsAvailable}kg). Ready for dispatch.`;
        } else if (effectiveAvailableQuantity >= allocated_quantity) {
          // Can produce required quantity from raw materials (yield-adjusted)
          allocationStatus = "ALLOCATED";
          allocationRemarks = `Raw materials sufficient for production (${rawMaterialStock}kg raw material, yields ${effectiveAvailableQuantity}kg finished product). Ready for production.`;
        } else {
          // Insufficient raw materials - create purchase request
          const shortageQuantity = Math.round(
            allocated_quantity - effectiveAvailableQuantity,
          );

          if (!alreadyCreatedPurchaseRequest) {
            try {
              await createPurchaseRequest(
                orderProduct.product_master_id,
                shortageQuantity,
                { pid: profile_id },
                { log: console },
              );
              purchaseRequestCreated = true;
            } catch (purchaseError) {
              console.error(
                "Failed to create purchase request during allocation:",
                purchaseError,
              );
              // Continue with allocation even if purchase request fails
            }
          }

          allocationStatus = "PENDING_PURCHASE";
          allocationRemarks = `Insufficient raw materials (${rawMaterialStock}kg available, ${shortageQuantity}kg shortage). Purchase request ${purchaseRequestCreated ? "created" : "already exists"}.`;
        }
      } catch (inventoryError) {
        console.error("Inventory check failed:", inventoryError);
        // Continue with default allocation if inventory check fails
        allocationRemarks =
          "Inventory check failed - allocated with default status";
      }

      // Create allocation record with determined status
      const allocationNo = `ALLOC-${Date.now()}`;
      const allocation = await models.AllocationMaster.create({
        allocation_no: allocationNo,
        order_id,
        order_product_id: order_product_id || null,
        packing_id,
        allocated_quantity,
        allocated_unit: packing.unit || "kg",
        allocation_date: new Date(),
        status: allocationStatus,
        remarks: allocationRemarks,
        created_by: profile_id,
      });

      // Update order status based on allocation status
      let newOrderStatus = order.order_status; // Keep current status by default

      if (allocationStatus === "ALLOCATED") {
        newOrderStatus = "ALLOCATED";
      } else if (allocationStatus === "PENDING_PURCHASE") {
        newOrderStatus = "PENDING_PURCHASE";
      }

      await order.update(
        {
          order_status: newOrderStatus,
          updated_by: profile_id,
        },
        { profile_id },
      );

      // Log transition
      await models.OrderStatusLog.create({
        order_id,
        from_status: "CONFIRMED",
        to_status: newOrderStatus,
        transition_date: new Date(),
        transition_reason: `Allocated ${allocated_quantity} units. ${allocationRemarks}`,
        metadata: {
          allocation_id: allocation.id,
          allocation_status: allocationStatus,
          purchase_request_created: purchaseRequestCreated,
        },
        created_by: profile_id,
      });

      resolve({
        statusCode: 201,
        message: `Inventory allocated successfully. ${allocationRemarks}`,
        data: {
          allocation,
          allocation_status: allocationStatus,
          purchase_request_created: purchaseRequestCreated,
          next_action:
            allocationStatus === "ALLOCATED"
              ? "Ready for Production/Dispatch"
              : allocationStatus === "PENDING_PURCHASE"
                ? "Wait for Purchase Request"
                : "Pending Allocation",
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Start production for allocated order
 * Transition: ALLOCATED -> IN_PRODUCTION
 */
export const StartProduction = async (profile_id, production_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        order_id,
        allocation_id,
        processing_type,
        scheduled_end_date,
        unit_id,
      } = production_data;

      if (!isValidUuid(order_id) || !isValidUuid(allocation_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid ID format",
        });
      }

      const order = await models.Orders.findOne({
        where: { id: order_id },
      });

      if (order.order_status !== "ALLOCATED") {
        return reject({
          statusCode: 409,
          message: "Order must be ALLOCATED to start production",
        });
      }

      // Get allocation with packing details
      const allocation = await models.AllocationMaster.findOne({
        where: { id: allocation_id, is_active: true },
      });

      if (!allocation) {
        return reject({
          statusCode: 404,
          message: "Allocation not found",
        });
      }

      // Create batch
      const lotNo = `BATCH-${Date.now()}`;
      const batch = await models.BatchMaster.create({
        batch_no: lotNo,
        species_id: production_data.species_id,
        product_form: production_data.product_form || "FROZEN",
        input_quantity_kg: allocation.allocated_quantity,
        batch_status: "IN_PRODUCTION",
        created_date: new Date(),
        production_start_date: new Date(),
        created_by: profile_id,
      });

      // Create production schedule
      const prodOrderNo = `PROD-${Date.now()}`;
      const productionSchedule = await models.ProductionSchedule.create({
        production_order_no: prodOrderNo,
        batch_id: batch.id,
        allocation_id,
        processing_type: processing_type || "HOSO",
        scheduled_start_date: new Date(),
        scheduled_end_date: new Date(scheduled_end_date),
        production_status: "IN_PROGRESS",
        unit_id: unit_id || null,
        assigned_to: profile_id,
        created_by: profile_id,
      });

      // Update order status
      await order.update(
        {
          order_status: "IN_PRODUCTION",
          updated_by: profile_id,
        },
        { profile_id },
      );

      // Log transition
      await models.OrderStatusLog.create({
        order_id,
        from_status: "ALLOCATED",
        to_status: "IN_PRODUCTION",
        transition_date: new Date(),
        metadata: {
          batch_id: batch.id,
          production_schedule_id: productionSchedule.id,
        },
        created_by: profile_id,
      });

      resolve({
        statusCode: 201,
        message: "Production started successfully",
        data: {
          batch,
          productionSchedule,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Record yield for batch
 * Updates batch with actual yield quantity
 */
export const CaptureYield = async (profile_id, yield_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { batch_id, actual_yield_qty } = yield_data;

      if (!isValidUuid(batch_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Batch ID format",
        });
      }

      const batch = await models.BatchMaster.findOne({
        where: { id: batch_id, is_active: true },
      });

      if (!batch) {
        return reject({
          statusCode: 404,
          message: "Batch not found",
        });
      }

      // Calculate yield variance
      const yieldVariance =
        ((actual_yield_qty - batch.input_quantity_kg) /
          batch.input_quantity_kg) *
        100;

      await batch.update(
        {
          actual_yield_qty,
          yield_variance_pct: yieldVariance,
          batch_status: "YIELD_RECORDED",
          production_end_date: new Date(),
          updated_by: profile_id,
        },
        { profile_id },
      );

      resolve({
        statusCode: 200,
        message: "Yield recorded successfully",
        data: batch,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get order with full workflow history
 */
export const GetOrderWithHistory = async (order_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(order_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Order ID format",
        });
      }

      const order = await models.Orders.findOne({
        where: { id: order_id, is_active: true },
        include: [
          {
            model: models.OrderProducts,
            where: { is_active: true },
          },
          {
            model: models.CustomerMaster,
          },
        ],
      });

      if (!order) {
        return reject({
          statusCode: 404,
          message: "Order not found",
        });
      }

      // Get status history
      const statusLog = await models.OrderStatusLog.findAll({
        where: { order_id, is_active: true },
        order: [["transition_date", "ASC"]],
      });

      resolve({
        statusCode: 200,
        data: {
          order,
          statusHistory: statusLog,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  Create,
  ConfirmOrder,
  AllocateInventory,
  StartProduction,
  CaptureYield,
  GetOrderWithHistory,
};
