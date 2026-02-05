const models = require("../../../../models");
const YieldBasedInventoryCalculator = require("../../../services/yield_based_inventory_calculator");

// Helper function to create purchase request
const createPurchaseRequest = async (
  productId,
  shortageQuantity,
  session,
  fastify,
) => {
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

const CheckInventory = async (
  { product_master_id, required_quantity },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("CheckInventory called with:", {
        product_master_id,
      });
      if (!product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      // Get product details
      const product = await models.ProductMaster.findOne({
        where: { id: product_master_id, is_active: true },
        attributes: [
          "id",
          "product_name",
          "derivative_master_id",
          "product_category_master_id",
          "species_derivative_size_grade_mapping_id",
        ],
        include: [
          {
            model: models.DerivativeMaster,
            as: "Derivative",
            attributes: ["id", "derivative_code", "derivative_name"],
            required: false,
          },
          {
            model: models.species_derivative_size_grade_mapping,
            as: "MappingProfile",
            attributes: ["id", "size_master_id", "expected_yield_percent"],
            required: false,
            include: [
              {
                model: models.SizeMaster,
                as: "size",
                attributes: ["id", "size", "unit_of_measure"],
                required: false,
              },
            ],
          },
        ],
      }).catch((err) => {
        console.error("Error fetching product:", err);
        throw new Error(`Failed to fetch product: ${err.message}`);
      });

      if (!product) {
        return resolve({
          statusCode: 200,
          message: "Product not found",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
            inventory_type: "none",
            unit_of_measure: "kg", // Default unit
          },
        });
      }

      // Check if this is a processed product by looking at the derivative code
      const isProcessedProduct =
        product?.Derivative?.derivative_code?.startsWith("PRC_") || false;

      // First, check if there's finished goods inventory available, regardless of processing status
      // Get unit IDs for Collection Center and Cold Storage (same logic as auto_allocate_stock)
      const allowedUnits = await models.UnitMaster.findAll({
        where: {
          unit_type: {
            [models.Sequelize.Op.in]: ["Collection Center", "Cold Storage"],
          },
          is_active: true,
        },
        attributes: ["id"],
      }).catch((err) => {
        console.error("Error fetching allowed units:", err);
        throw new Error(`Failed to fetch allowed units: ${err.message}`);
      });

      const allowedUnitIds = allowedUnits.map((unit) => unit.id);

      const fgSumQuery = `
        SELECT COALESCE(SUM(inv.available_qty), 0) as fg_available_qty
        FROM inventory_stock inv
        WHERE inv.product_id = :product_id
        AND inv.unit_id IN (:allowedUnitIds)
      `;

      const [fgResult] = await models.sequelize
        .query(fgSumQuery, {
          replacements: {
            product_id: product.id,
            allowedUnitIds: allowedUnitIds.length > 0 ? allowedUnitIds : [null],
          },
          type: models.sequelize.QueryTypes.SELECT,
        })
        .catch((err) => {
          console.error("Error executing FG inventory query:", err);
          throw new Error(
            `Failed to execute FG inventory query: ${err.message}`,
          );
        });

      const totalFGInventory = parseFloat(fgResult?.fg_available_qty || 0);

      // Add debug logging
      console.log("DEBUG: FG Inventory Query Results", {
        product_id: product.id,
        allowedUnitIds,
        fgResult,
        totalFGInventory,
        isProcessedProduct,
      });

      // If we have finished goods inventory, treat as available stock (regardless of processing status)
      if (totalFGInventory > 0) {
        // Fetch sales/allocated quantities
        const salesQuery = `
          SELECT COALESCE(SUM(si.quantity), 0) as total_sales_inventory_qty
          FROM sales_inventory si
          WHERE si.product_master_id = :product_id
          AND si.is_active = true
        `;

        const replacements = { product_id: product.id };

        const [salesResult] = await models.sequelize.query(salesQuery, {
          replacements,
          type: models.sequelize.QueryTypes.SELECT,
        });

        const totalSalesAllocations = parseFloat(
          salesResult?.total_sales_inventory_qty || 0,
        );

        // The inventory_stock.available_qty already accounts for allocations
        // (auto-allocation reduces available_qty when stock is allocated)
        // So we don't need to subtract sales_inventory again - that would double-count

        // Get total FG inventory (without considering allocations for breakdown)
        const totalFGQuery = `
          SELECT COALESCE(SUM(inv.on_hand_qty), 0) as total_fg_quantity
          FROM inventory_stock inv
          WHERE inv.product_id = :product_id
          AND inv.unit_id IN (:allowedUnitIds)
        `;

        const [totalFGResult] = await models.sequelize.query(totalFGQuery, {
          replacements: {
            product_id: product.id,
            allowedUnitIds: allowedUnitIds.length > 0 ? allowedUnitIds : [null],
          },
          type: models.sequelize.QueryTypes.SELECT,
        });

        const totalFGQuantity = parseFloat(
          totalFGResult?.total_fg_quantity || 0,
        );

        // Get unit of measure from the mapping
        let unitOfMeasure =
          product?.MappingProfile?.size?.unit_of_measure || "kg";

        // If nested include didn't work, try to fetch the mapping separately
        if (
          unitOfMeasure === "kg" &&
          product.species_derivative_size_grade_mapping_id
        ) {
          try {
            const mapping =
              await models.species_derivative_size_grade_mapping.findOne({
                where: { id: product.species_derivative_size_grade_mapping_id },
                include: [
                  {
                    model: models.SizeMaster,
                    as: "size",
                    attributes: ["id", "size", "unit_of_measure"],
                    required: false,
                  },
                ],
              });
            if (mapping?.size?.unit_of_measure) {
              unitOfMeasure = mapping.size.unit_of_measure;
            }
          } catch (error) {
            console.log("Error fetching mapping separately:", error.message);
          }
        }

        // Check for raw material stock availability
        const rawMaterialQuery = `
          SELECT COALESCE(SUM(pi.quantity), 0) as raw_material_qty
          FROM purchase_inventory pi
          WHERE pi.product_master_id = :product_id
          AND pi.is_active = true
        `;

        const [rawMaterialResult] = await models.sequelize.query(
          rawMaterialQuery,
          {
            replacements: { product_id: product.id },
            type: models.sequelize.QueryTypes.SELECT,
          },
        );

        const rawMaterialStock = parseFloat(
          rawMaterialResult?.raw_material_qty || 0,
        );

        // Check if purchase request is needed
        const finalAvailableQuantity = Number(totalFGInventory);
        let purchaseRequestCreated = false;

        if (required_quantity && finalAvailableQuantity < required_quantity) {
          try {
            await createPurchaseRequest(
              product.id,
              Math.round(required_quantity - finalAvailableQuantity),
              session,
              fastify,
            );
            purchaseRequestCreated = true;
            console.log(
              `📋 Purchase request created for ${Math.round(required_quantity - finalAvailableQuantity)}kg shortage of ${product.product_name}`,
            );
          } catch (error) {
            console.error("Error creating purchase request:", error);
          }
        }

        // Return the actual available quantity from inventory_stock (already accounts for allocations)
        return resolve({
          statusCode: 200,
          message: "Available inventory (unallocated stock only)",
          data: {
            product_master_id,
            available_quantity: Math.round(finalAvailableQuantity), // This is already the available (unallocated) quantity
            has_stock: totalFGInventory > 0,
            inventory_type: totalFGInventory > 0 ? "finished_goods" : "none",
            unit_of_measure: unitOfMeasure,
            breakdown: {
              sales_inventory: Math.round(totalSalesAllocations), // Allocated to sales
              fg_inventory: Math.round(totalFGInventory), // Available FG inventory
              raw_material_stock: Math.round(rawMaterialStock), // Raw material stock
              total_inventory: Math.round(totalFGQuantity),
              total_allocations: Math.round(totalSalesAllocations),
              available_stock: Math.round(totalFGInventory),
            },
            purchase_request_created: purchaseRequestCreated,
            shortage_amount:
              required_quantity && finalAvailableQuantity < required_quantity
                ? Math.round(required_quantity - finalAvailableQuantity)
                : 0,
          },
        });
      }

      // For products without finished goods inventory, calculate from raw materials using BOM
      // Get the BOM data for this product
      const bomEntries = await models.BillOfMaterials.findAll({
        where: { product_master_id: product.id, is_active: true },
        include: [
          {
            model: models.ProcurementProducts,
            as: "ProcurementProduct",
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
              },
            ],
          },
        ],
      });

      if (!bomEntries || bomEntries.length === 0) {
        return resolve({
          statusCode: 200,
          message: "No Bill of Materials configured for this product",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
            inventory_type: "none",
          },
        });
      }

      // Get raw material from first BOM entry
      const firstBomEntry = bomEntries[0];
      const rawMaterialProduct =
        firstBomEntry.ProcurementProduct?.ProductMaster;

      if (!rawMaterialProduct) {
        return resolve({
          statusCode: 200,
          message: "Raw material product not found",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
            inventory_type: "none",
          },
        });
      }

      // Calculate available stock from purchase_inventory
      const inventoryQuery = `
        SELECT COALESCE(SUM(pi.quantity), 0) as available_qty
        FROM purchase_inventory pi
        WHERE pi.product_master_id = :product_id
        AND pi.is_active = true
      `;

      const [inventoryResult] = await models.sequelize.query(inventoryQuery, {
        replacements: { product_id: rawMaterialProduct.id },
        type: models.sequelize.QueryTypes.SELECT,
      });

      const rawMaterialStockKg = inventoryResult?.available_qty || 0;

      // Get yield data from product mapping
      const yieldData = {
        base_yield_percent:
          product.MappingProfile?.expected_yield_percent || 85,
      };

      // Calculate effective finished goods quantity using yield standards
      const effectiveFinishedGoodsQty =
        await YieldBasedInventoryCalculator.calculateEffectiveInventory(
          product.id, // Use finished product ID for yield calculation (rings, not raw whole round)
          rawMaterialStockKg,
        ).catch((err) => {
          console.error("Error calculating effective inventory:", err);
          throw new Error(
            `Failed to calculate effective inventory: ${err.message}`,
          );
        });

      // Get unit of measure from the mapping
      let unitOfMeasure =
        product?.MappingProfile?.size?.unit_of_measure || "kg";

      // Check if purchase request is needed
      const finalAvailableQuantity = effectiveFinishedGoodsQty;
      let purchaseRequestCreated = false;

      if (required_quantity && finalAvailableQuantity < required_quantity) {
        try {
          await createPurchaseRequest(
            product.id,
            Math.round(required_quantity - finalAvailableQuantity),
            session,
            fastify,
          );
          purchaseRequestCreated = true;
          console.log(
            `📋 Purchase request created for ${Math.round(required_quantity - finalAvailableQuantity)}kg shortage of ${product.product_name}`,
          );
        } catch (error) {
          console.error("Error creating purchase request:", error);
        }
      }

      resolve({
        statusCode: 200,
        message:
          effectiveFinishedGoodsQty > 0
            ? "Raw materials inventory available (yield-adjusted)"
            : "No raw materials available",
        data: {
          product_master_id,
          available_quantity: Math.round(effectiveFinishedGoodsQty),
          has_stock: effectiveFinishedGoodsQty > 0,
          inventory_type:
            effectiveFinishedGoodsQty > 0 ? "raw_materials" : "none",
          unit_of_measure: unitOfMeasure,
          breakdown: {
            raw_material_stock: Math.round(rawMaterialStockKg),
            effective_finished_goods: Math.round(effectiveFinishedGoodsQty),
            yield_percent: yieldData.base_yield_percent,
          },
          raw_material_details: {
            product_name: rawMaterialProduct.product_name,
            raw_material_quantity: Math.round(rawMaterialStockKg),
            yield_percent: yieldData.base_yield_percent,
            effective_yield_used: true,
          },
          purchase_request_created: purchaseRequestCreated,
          shortage_amount:
            required_quantity && finalAvailableQuantity < required_quantity
              ? Math.round(required_quantity - finalAvailableQuantity)
              : 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject({
        statusCode: 500,
        message: "Error checking inventory",
        error: err.message,
      });
    }
  });
};

module.exports = { CheckInventory };
