import AllocationMaster from "../../../models/allocation_master";
import Orders from "../../../models/orders";
import OrderProducts from "../../../models/order_products";
const { CheckInventory } = require("../orders/handlers/check_inventory");

// Import the createPurchaseRequest helper function
const createPurchaseRequest = async (
  productId,
  shortageQuantity,
  session,
  fastify,
) => {
  const models = require("../../../models");

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

export default async (fastify) => {
  // Create new allocation
  fastify.post("/", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const {
          order_id,
          inventory_id,
          packing_id,
          allocation_qty,
          order_product_id,
        } = request.body;
        const profile_id = request.token_profile_id;

        // Validate required fields
        if (!order_id || !UUID_PATTERN.test(order_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_id",
          });
        }

        // Either inventory_id or packing_id must be provided
        if (
          (!inventory_id || !UUID_PATTERN.test(inventory_id)) &&
          (!packing_id || !UUID_PATTERN.test(packing_id))
        ) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Either inventory_id or packing_id must be provided",
          });
        }

        if (!allocation_qty || allocation_qty <= 0) {
          return reply.code(400).send({
            statusCode: 400,
            message: "allocation_qty must be a positive number",
          });
        }

        if (!order_product_id || !UUID_PATTERN.test(order_product_id)) {
          return reply.code(400).send({
            statusCode: 400,
            message: "Invalid or missing order_product_id",
          });
        }

        // Check order status
        const order = await Orders.findByPk(order_id);
        if (!order) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order not found",
          });
        }

        if (order.order_status !== "CONFIRMED") {
          return reply.code(400).send({
            statusCode: 400,
            message: `Order must be CONFIRMED to allocate. Current status: ${order.order_status}`,
          });
        }

        // Get order product to find product_master_id
        const orderProduct = await OrderProducts.findByPk(order_product_id);
        if (!orderProduct) {
          return reply.code(404).send({
            statusCode: 404,
            message: "Order product not found",
          });
        }

        // Check inventory and create purchase request if needed
        let purchaseRequestCreated = false;
        try {
          const inventoryCheck = await CheckInventory(
            {
              product_master_id: orderProduct.product_master_id,
              required_quantity: allocation_qty,
            },
            { pid: profile_id }, // Pass profile_id for purchase request creation
            fastify,
          );

          const availableQuantity =
            inventoryCheck?.data?.available_quantity || 0;
          const inventoryType = inventoryCheck?.data?.inventory_type;
          const rawMaterialStock =
            inventoryCheck?.data?.breakdown?.raw_material_stock || 0;
          const alreadyCreatedPurchaseRequest =
            inventoryCheck?.data?.purchase_request_created || false;

          // If raw materials are insufficient and no purchase request was created yet, create one
          if (
            inventoryType === "raw_materials" &&
            rawMaterialStock < allocation_qty &&
            !alreadyCreatedPurchaseRequest
          ) {
            const shortageQuantity = Math.round(
              allocation_qty - rawMaterialStock,
            );
            try {
              await createPurchaseRequest(
                orderProduct.product_master_id,
                shortageQuantity,
                { pid: profile_id },
                fastify,
              );
              purchaseRequestCreated = true;
              fastify.log.info(
                `Purchase request created for ${shortageQuantity}kg shortage during allocation`,
              );
            } catch (purchaseError) {
              fastify.log.error(
                "Failed to create purchase request during allocation:",
                purchaseError,
              );
              // Continue with allocation even if purchase request fails
            }
          }

          // Verify that the effective yield allows for the required quantity
          if (allocation_qty > availableQuantity) {
            return reply.code(400).send({
              statusCode: 400,
              message: `Insufficient effective inventory after yield calculation. Requested: ${allocation_qty}, Effective available: ${availableQuantity}`,
            });
          }
        } catch (inventoryError) {
          fastify.log.error("Inventory check failed:", inventoryError);
          return reply.code(500).send({
            statusCode: 500,
            message: "Failed to check inventory availability",
          });
        }

        // Determine allocation status based on inventory availability
        let allocationStatus = "PENDING_PURCHASE"; // Default when insufficient inventory
        let allocationRemarks = "";

        const availableQuantity = inventoryCheck?.data?.available_quantity || 0;
        const finishedGoodsAvailable =
          inventoryCheck?.data?.breakdown?.effective_finished_goods || 0;
        const rawMaterialStock =
          inventoryCheck?.data?.breakdown?.raw_material_stock || 0;

        console.log(
          `🎯 Allocation Debug - Product: ${orderProduct.product_master_id}, Requested: ${allocation_qty}, Available: ${availableQuantity}, FG: ${finishedGoodsAvailable}, Raw: ${rawMaterialStock}`,
        );

        if (finishedGoodsAvailable >= allocation_qty) {
          // Finished goods are available - can allocate immediately
          allocationStatus = "ALLOCATED";
          allocationRemarks = `Finished goods available (${finishedGoodsAvailable}kg). Ready for dispatch.`;
          console.log(
            `✅ Setting status to ALLOCATED - finished goods available`,
          );
        } else if (availableQuantity >= allocation_qty) {
          // Can produce required quantity from raw materials (yield-adjusted)
          allocationStatus = "ALLOCATED";
          allocationRemarks = `Raw materials sufficient for production (${rawMaterialStock}kg raw material, yields ${availableQuantity}kg finished product). Ready for production.`;
          console.log(
            `✅ Setting status to ALLOCATED - raw materials sufficient`,
          );
        } else {
          // Insufficient inventory - needs purchase
          allocationStatus = "PENDING_PURCHASE";
          allocationRemarks = `Insufficient raw materials (${rawMaterialStock}kg available, ${allocation_qty - availableQuantity}kg shortage). Purchase request ${purchaseRequestCreated ? "created" : "already exists"}.`;
          console.log(
            `⚠️ Setting status to PENDING_PURCHASE - insufficient inventory`,
          );
        }

        // Create allocation
        const allocationNo = `ALLOC-${Date.now()}`;
        const allocation = await AllocationMaster.create({
          allocation_no: allocationNo,
          order_id,
          order_product_id,
          packing_id: packing_id || null, // null if allocating from inventory
          allocated_quantity: allocation_qty,
          allocated_unit: "KG", // Default unit
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

        await order.update({
          order_status: newOrderStatus,
          updated_by: profile_id,
        });

        return reply.code(201).send({
          statusCode: 201,
          message: "Allocation created successfully",
          data: allocation,
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
