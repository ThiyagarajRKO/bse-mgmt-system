import models, { sequelize } from "../../models";
import { v4 as uuidv4 } from "uuid";

/**
 * Automatically creates production tracking records when an order is created
 * Includes:
 * - Production Order
 * - Dispatch Record
 * - Peeling Record
 */

export const createOrderTrackingPipeline = async (order, options) => {
  const transaction = await sequelize.transaction();

  try {
    console.log(`[OrderTracking] Starting pipeline for order ${order.id}`);

    // Get order products to calculate total quantity
    const orderProducts = await models.OrderProducts.findAll({
      where: { order_id: order.id, is_active: true },
      transaction,
    });

    if (!orderProducts || orderProducts.length === 0) {
      console.warn(
        `[OrderTracking] No products found for order ${order.id}. Skipping tracking pipeline.`,
      );
      await transaction.rollback();
      return;
    }

    // Calculate total quantity from order products
    const totalQuantity = orderProducts.reduce(
      (sum, product) => sum + (product.quantity || 0),
      0,
    );

    if (totalQuantity === 0) {
      console.warn(
        `[OrderTracking] Total quantity is 0 for order ${order.id}. Skipping tracking pipeline.`,
      );
      await transaction.rollback();
      return;
    }

    const userId = options.profile_id;
    const orderNumber = order.order_no || `ORDER-${order.id.substring(0, 8)}`;

    // Step 1: Create Production Order
    const productionOrder = await createProductionOrder(
      order,
      orderNumber,
      totalQuantity,
      userId,
      transaction,
    );

    console.log(
      `[OrderTracking] Created production order ${productionOrder.id}`,
    );

    // Step 2: Create Dispatch Record
    const dispatchRecord = await createDispatchRecord(
      order,
      totalQuantity,
      userId,
      transaction,
    );

    console.log(`[OrderTracking] Created dispatch record ${dispatchRecord.id}`);

    // Step 3: Create Peeling Record (if dispatch exists)
    if (dispatchRecord) {
      const peelingRecord = await createPeelingRecord(
        order,
        dispatchRecord,
        totalQuantity * 0.95, // 95% yield after peeling
        userId,
        transaction,
      );

      console.log(`[OrderTracking] Created peeling record ${peelingRecord.id}`);

      // Step 4: Create Peeling Products for each order product
      const peelingProducts = await createPeelingProducts(
        peelingRecord,
        orderProducts,
        userId,
        transaction,
      );

      console.log(
        `[OrderTracking] Created ${peelingProducts.length} peeling products`,
      );

      // Step 5: Create Peeled Dispatches from peeling products
      const peeledDispatches = await createPeeledDispatches(
        order,
        peelingProducts,
        userId,
        transaction,
      );

      console.log(
        `[OrderTracking] Created ${peeledDispatches.length} peeled dispatches`,
      );

      // Step 6: Create Packing records from peeled dispatches
      const packingRecords = await createPackingRecords(
        peeledDispatches,
        userId,
        transaction,
      );

      console.log(
        `[OrderTracking] Created ${packingRecords.length} packing records`,
      );

      // Step 7: Create Sales Inventory from packing records
      const salesInventory = await createSalesInventoryRecords(
        order,
        packingRecords,
        orderProducts,
        userId,
        transaction,
      );

      console.log(
        `[OrderTracking] Created ${salesInventory.length} sales inventory records`,
      );
    }

    await transaction.commit();
    console.log(
      `[OrderTracking] Completed pipeline for order ${order.id}. Tracking records created successfully.`,
    );

    return {
      success: true,
      productionOrder,
      dispatchRecord,
    };
  } catch (error) {
    await transaction.rollback();
    console.error(
      `[OrderTracking] Error creating tracking pipeline for order ${order.id}:`,
      error.message || error,
    );
    throw error;
  }
};

/**
 * Create Production Order record
 */
const createProductionOrder = async (
  order,
  orderNumber,
  totalQuantity,
  userId,
  transaction,
) => {
  try {
    // Get a plant if available
    const plant = await models.PlantMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const plantId = plant?.id || null;

    // Get species from first product
    const firstProduct = await models.OrderProducts.findOne({
      where: { order_id: order.id, is_active: true },
      include: [
        {
          model: models.ProductMaster,
          as: "product",
          attributes: ["id", "species_master_id"],
        },
      ],
      transaction,
    });

    const speciesId = firstProduct?.product?.species_master_id || null;

    const productionOrder = await models.production_orders.create(
      {
        id: uuidv4(),
        order_id: order.id,
        order_no: orderNumber,
        order_type: "SALES",
        plant_id: plantId,
        input_species_id: speciesId,
        planned_quantity_kg: totalQuantity,
        planned_start_date: new Date(),
        status: "PENDING",
        issued_quantity_kg: totalQuantity,
        produced_quantity_kg: Math.floor(totalQuantity * 0.95), // 95% yield
        wastage_quantity_kg: Math.ceil(totalQuantity * 0.05),
        yield_variance_percent: 5,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      },
      { transaction },
    );

    return productionOrder;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating production order:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Dispatch record
 */
const createDispatchRecord = async (
  order,
  totalQuantity,
  userId,
  transaction,
) => {
  try {
    // Get unit master (default to first available)
    const unitMaster = await models.UnitMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const unitMasterId = unitMaster?.id || null;

    // Get a vehicle and driver if available
    const vehicle = await models.VehicleMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const driver = await models.DriverMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    // Get procurement product (optional, may not be relevant for sales orders)
    const procurementProduct = await models.ProcurementProducts.findOne({
      where: { order_id: order.id, is_active: true },
      transaction,
    });

    const dispatchRecord = await models.Dispatches.create(
      {
        id: uuidv4(),
        order_id: order.id,
        procurement_product_id: procurementProduct?.id || null,
        unit_master_id: unitMasterId,
        dispatch_quantity: totalQuantity * 0.95, // 95% after production
        temperature: 4, // Standard cold chain temp
        vehicle_master_id: vehicle?.id || null,
        driver_master_id: driver?.id || null,
        delivery_status: "Pending",
        is_active: true,
        created_by: userId,
        updated_by: userId,
      },
      { transaction },
    );

    return dispatchRecord;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating dispatch record:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Peeling record
 */
const createPeelingRecord = async (
  order,
  dispatchRecord,
  peelingQuantity,
  userId,
  transaction,
) => {
  try {
    // Get unit master
    const unitMaster = await models.UnitMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const unitMasterId = unitMaster?.id || null;

    const peelingRecord = await models.Peeling.create(
      {
        id: uuidv4(),
        dispatch_id: dispatchRecord.id,
        unit_master_id: unitMasterId,
        peeling_quantity: peelingQuantity,
        peeling_method: "Manual", // Default to Manual peeling
        is_active: true,
        order_id: order.id,
        created_by: userId,
        updated_by: userId,
      },
      { transaction },
    );

    return peelingRecord;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating peeling record:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Peeling Products (breakdown of peeling by product)
 */
const createPeelingProducts = async (
  peelingRecord,
  orderProducts,
  userId,
  transaction,
) => {
  try {
    const peelingProducts = [];

    for (const orderProduct of orderProducts) {
      const yieldQuantity = (orderProduct.quantity || 0) * 0.95; // 95% yield

      const peelingProduct = await models.PeelingProducts.create(
        {
          id: uuidv4(),
          peeling_id: peelingRecord.id,
          product_master_id: orderProduct.product_master_id,
          yield_quantity: yieldQuantity,
          peeling_status: "In Progress",
          is_active: true,
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );

      peelingProducts.push(peelingProduct);
    }

    return peelingProducts;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating peeling products:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Peeled Dispatches from peeling products
 */
const createPeeledDispatches = async (
  order,
  peelingProducts,
  userId,
  transaction,
) => {
  try {
    const peeledDispatches = [];

    // Get vehicle and driver
    const vehicle = await models.VehicleMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const driver = await models.DriverMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    const unitMaster = await models.UnitMaster.findOne({
      where: { is_active: true },
      transaction,
    });

    for (const peelingProduct of peelingProducts) {
      const peeledDispatch = await models.PeeledDispatches.create(
        {
          id: uuidv4(),
          peeled_product_id: peelingProduct.id,
          unit_master_id: unitMaster?.id || null,
          peeled_dispatch_quantity: peelingProduct.yield_quantity,
          temperature: 4, // Cold chain
          vehicle_master_id: vehicle?.id || null,
          driver_master_id: driver?.id || null,
          delivery_status: "In Transit",
          is_active: true,
          order_id: order.id,
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );

      peeledDispatches.push(peeledDispatch);
    }

    return peeledDispatches;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating peeled dispatches:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Packing records from peeled dispatches
 */
const createPackingRecords = async (peeledDispatches, userId, transaction) => {
  try {
    const packingRecords = [];

    for (const peeledDispatch of peeledDispatches) {
      // Get packing details from the peeled dispatch's product
      const peelingProduct = await models.PeelingProducts.findByPk(
        peeledDispatch.peeled_product_id,
        { transaction },
      );

      // Get a grade and size for packaging
      const gradeMaster = await models.GradeMaster.findOne({
        where: { is_active: true },
        transaction,
      });

      const sizeMaster = await models.SizeMaster.findOne({
        where: { is_active: true },
        transaction,
      });

      const packagingMaster = await models.PackagingMaster.findOne({
        where: { is_active: true },
        transaction,
      });

      const unitMaster = await models.UnitMaster.findOne({
        where: { is_active: true },
        transaction,
      });

      // Get cold storage
      const coldStorage = await models.UnitMaster.findOne({
        where: { is_active: true },
        transaction,
      });

      const packing = await models.Packing.create(
        {
          id: uuidv4(),
          peeled_dispatch_id: peeledDispatch.id,
          unit_master_id: unitMaster?.id || null,
          grade_master_id: gradeMaster?.id || null,
          size_master_id: sizeMaster?.id || null,
          packaging_master_id: packagingMaster?.id || null,
          packing_quantity: peeledDispatch.peeled_dispatch_quantity,
          packing_status: "In Progress",
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cold_storage_id: coldStorage?.id || null,
          is_active: true,
          order_id: peeledDispatch.order_id,
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );

      packingRecords.push(packing);
    }

    return packingRecords;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating packing records:",
      error.message,
    );
    throw error;
  }
};

/**
 * Create Sales Inventory records from packing records
 */
const createSalesInventoryRecords = async (
  order,
  packingRecords,
  orderProducts,
  userId,
  transaction,
) => {
  try {
    const salesInventoryRecords = [];

    for (const packing of packingRecords) {
      // Get the corresponding product from the peeled dispatch
      const peeledDispatch = await models.PeeledDispatches.findByPk(
        packing.peeled_dispatch_id,
        {
          include: [
            {
              model: models.PeelingProducts,
              as: "pp",
              attributes: ["product_master_id"],
            },
          ],
          transaction,
        },
      );

      const productMasterId =
        peeledDispatch?.pp?.product_master_id ||
        orderProducts[0]?.product_master_id;

      const salesInventory = await models.SalesInventory.create(
        {
          id: uuidv4(),
          product_master_id: productMasterId,
          packing_id: packing.id,
          quantity: packing.packing_quantity,
          order_id: order.id,
          is_active: true,
          created_by: userId,
          updated_by: userId,
        },
        { transaction },
      );

      salesInventoryRecords.push(salesInventory);
    }

    return salesInventoryRecords;
  } catch (error) {
    console.error(
      "[OrderTracking] Error creating sales inventory:",
      error.message,
    );
    throw error;
  }
};

export default {
  createOrderTrackingPipeline,
};
