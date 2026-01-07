import models from "../../models";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === "string" && UUID_PATTERN.test(id);

/**
 * Create carton and map to batch (for traceability)
 */
export const CreateCarton = async (profile_id, carton_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        batch_id,
        packing_id,
        product_id,
        net_weight_kg,
        gross_weight_kg,
        units_per_carton,
      } = carton_data;

      if (
        !isValidUuid(batch_id) ||
        !isValidUuid(packing_id) ||
        !isValidUuid(product_id)
      ) {
        return reject({
          statusCode: 422,
          message: "Invalid ID format",
        });
      }

      // Verify batch exists
      const batch = await models.BatchMaster.findOne({
        where: { id: batch_id, is_active: true },
      });

      if (!batch) {
        return reject({
          statusCode: 404,
          message: "Batch not found",
        });
      }

      if (batch.batch_status !== "QA_APPROVED") {
        return reject({
          statusCode: 409,
          message: "Batch must be QA_APPROVED before carton creation",
        });
      }

      // Generate carton ID
      const cartonId = `CARTON-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const carton = await models.CartonMapping.create({
        carton_id: cartonId,
        batch_id,
        packing_id,
        product_id,
        net_weight_kg,
        gross_weight_kg,
        units_per_carton,
        production_date: new Date(),
        carton_status: "CREATED",
        best_before_date: carton_data.best_before_date || null,
        created_by: profile_id,
      });

      resolve({
        statusCode: 201,
        message: "Carton created successfully",
        data: carton,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Create dispatch with cartons
 * Transition: PACKED -> READY_FOR_DISPATCH -> DISPATCHED
 */
export const CreateDispatch = async (profile_id, dispatch_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { order_id, carton_ids, vehicle_id, driver_id, delivery_address } =
        dispatch_data;

      if (
        !isValidUuid(order_id) ||
        !Array.isArray(carton_ids) ||
        carton_ids.length === 0
      ) {
        return reject({
          statusCode: 422,
          message: "Invalid order_id or carton_ids",
        });
      }

      const order = await models.Orders.findOne({
        where: { id: order_id, is_active: true },
      });

      if (!order) {
        return reject({
          statusCode: 404,
          message: "Order not found",
        });
      }

      if (order.order_status !== "PACKED") {
        return reject({
          statusCode: 409,
          message: "Order must be PACKED before dispatch",
        });
      }

      // Get cartons
      const cartons = await models.CartonMapping.findAll({
        where: { carton_id: carton_ids, is_active: true },
      });

      if (cartons.length !== carton_ids.length) {
        return reject({
          statusCode: 404,
          message: "Some cartons not found",
        });
      }

      // Create dispatch items and update carton status
      const dispatchItems = [];

      for (const carton of cartons) {
        // Create dispatch item
        const dispatchItem = await models.DispatchItems.create({
          dispatch_id: null, // Will be set after creating dispatch
          carton_id: carton.carton_id,
          carton_mapping_id: carton.id,
          batch_id: carton.batch_id,
          product_id: carton.product_id,
          net_weight_kg: carton.net_weight_kg,
          gross_weight_kg: carton.gross_weight_kg,
          item_status: "READY",
          created_by: profile_id,
        });

        dispatchItems.push(dispatchItem);

        // Update carton status
        await carton.update(
          {
            carton_status: "READY_FOR_DISPATCH",
            updated_by: profile_id,
          },
          { profile_id }
        );
      }

      // Update order status
      await order.update(
        {
          order_status: "READY_FOR_DISPATCH",
          updated_by: profile_id,
        },
        { profile_id }
      );

      // Log transition
      await models.OrderStatusLog.create({
        order_id,
        from_status: "PACKED",
        to_status: "READY_FOR_DISPATCH",
        transition_date: new Date(),
        transition_reason: `Dispatch prepared with ${carton_ids.length} cartons`,
        metadata: {
          carton_ids,
          dispatch_items: dispatchItems.map((d) => d.id),
        },
        created_by: profile_id,
      });

      resolve({
        statusCode: 200,
        message: "Dispatch prepared successfully",
        data: {
          order_id,
          cartons_prepared: carton_ids.length,
          dispatch_items: dispatchItems,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Forward traceability: Fish -> Batch -> Carton -> Customer
 */
export const TraceForward = async (batch_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(batch_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Batch ID format",
        });
      }

      // Get batch with production details
      const batch = await models.BatchMaster.findOne({
        where: { id: batch_id },
        include: [
          {
            model: models.SpeciesMaster,
            attributes: ["id", "species_name"],
          },
        ],
      });

      if (!batch) {
        return reject({
          statusCode: 404,
          message: "Batch not found",
        });
      }

      // Get cartons from this batch
      const cartons = await models.CartonMapping.findAll({
        where: { batch_id },
        include: [
          {
            model: models.CustomerMaster,
            attributes: ["id", "customer_name", "customer_code"],
          },
          {
            model: models.ProductMaster,
            attributes: ["id", "product_name"],
          },
        ],
      });

      // Get traceability records
      const traceability = await models.TraceabilityMap.findAll({
        where: { batch_id },
        include: [
          {
            model: models.Orders,
            attributes: ["id", "order_no"],
          },
          {
            model: models.Invoice,
            attributes: ["id", "invoice_no"],
          },
        ],
      });

      resolve({
        statusCode: 200,
        message: "Forward traceability retrieved",
        data: {
          batch: {
            id: batch.id,
            batch_no: batch.batch_no,
            species: batch.SpeciesMaster?.species_name,
            status: batch.batch_status,
          },
          cartons,
          traceability,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Backward traceability: Customer -> Carton -> Batch -> Fish
 */
export const TraceBackward = async (carton_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof carton_id !== "string") {
        return reject({
          statusCode: 422,
          message: "Invalid Carton ID",
        });
      }

      // Get carton
      const carton = await models.CartonMapping.findOne({
        where: { carton_id },
        include: [
          {
            model: models.BatchMaster,
            include: [
              {
                model: models.SpeciesMaster,
                attributes: ["id", "species_name"],
              },
            ],
          },
          {
            model: models.CustomerMaster,
            attributes: ["id", "customer_name"],
          },
        ],
      });

      if (!carton) {
        return reject({
          statusCode: 404,
          message: "Carton not found",
        });
      }

      // Get trace record
      const trace = await models.TraceabilityMap.findOne({
        where: { carton_id },
        include: [
          {
            model: models.Orders,
            attributes: ["id", "order_no"],
          },
          {
            model: models.Invoice,
            attributes: ["id", "invoice_no"],
          },
          {
            model: models.SupplierMaster,
            attributes: ["id", "supplier_name"],
          },
        ],
      });

      resolve({
        statusCode: 200,
        message: "Backward traceability retrieved",
        data: {
          carton: {
            carton_id: carton.carton_id,
            status: carton.carton_status,
            packing_date: carton.packing_date,
          },
          batch: carton.BatchMaster,
          customer: carton.CustomerMaster,
          traceability: trace,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  CreateCarton,
  CreateDispatch,
  TraceForward,
  TraceBackward,
};
