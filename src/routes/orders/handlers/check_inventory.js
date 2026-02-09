const models = require("../../../../models");
const YieldBasedInventoryCalculator = require("../../../services/yield_based_inventory_calculator");

// Helper function to remove secondary UOM from bracket notation
// e.g. "g (per piece)" -> "g", "kg" -> "kg"
const cleanUOM = (uom) => {
  if (!uom) return "kg";
  return uom.replace(/\s*\(.*\)/, "").trim();
};

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

      // Validate UUID format
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(String(product_master_id))) {
        return reject({
          statusCode: 420,
          message: "Invalid Product ID format!",
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

      // Get unit IDs for Collection Center and Cold Storage
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

      // REQUIREMENT: Finished goods inventory should be 0 unless production is complete
      // and the finished goods is available in sales_inventory.
      //
      // Structure:
      // - sales_inventory = finished goods (processed, ready to sell)
      // - purchase_inventory = raw materials (unprocessed input)
      //
      // Check if product exists in sales_inventory (indicates production is complete)
      const salesInventoryQuery = `
        SELECT COUNT(*) as count, COALESCE(SUM(si.quantity), 0) as total_quantity
        FROM sales_inventory si
        WHERE si.product_master_id = :product_id
        AND si.is_active = true
      `;

      const [salesInventoryResult] = await models.sequelize.query(
        salesInventoryQuery,
        {
          replacements: { product_id: product.id },
          type: models.sequelize.QueryTypes.SELECT,
        },
      );

      const existsInSalesInventory = (salesInventoryResult?.count || 0) > 0;
      const finishedGoodsInventory = parseFloat(
        salesInventoryResult?.total_quantity || 0,
      );

      console.log("DEBUG: Finished Goods Check (Sales Inventory)", {
        product_id: product.id,
        existsInSalesInventory,
        finishedGoodsInventory,
      });

      // Only treat as finished goods if BOTH conditions are met:
      // 1. Product exists in sales_inventory (production is complete)
      // 2. Physical stock exists in sales_inventory (finishedGoodsInventory > 0)
      const isFinishedGoodsAvailable =
        existsInSalesInventory && finishedGoodsInventory > 0;

      if (isFinishedGoodsAvailable) {
        // Finished goods are available from sales_inventory
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

        // Remove secondary UOM from bracket notation
        unitOfMeasure = cleanUOM(unitOfMeasure);

        // Get total FG inventory (from inventory_stock for breakdown)
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

        // Check if purchase request is needed
        const finalAvailableQuantity = Math.round(finishedGoodsInventory);
        let purchaseRequestCreated = false;

        // Check if an approved purchase request already exists for this product/order
        // Note: order_id is not passed in params, so this check is skipped
        // The order_id would need to be passed from the frontend for this to work

        // If no approved purchase request exists, check if we need to create one
        if (
          required_quantity &&
          finalAvailableQuantity < required_quantity &&
          !purchaseRequestCreated
        ) {
          try {
            await createPurchaseRequest(
              product.id,
              Math.round(required_quantity - finalAvailableQuantity),
              session,
              fastify,
            );
            purchaseRequestCreated = true;
            console.log(
              `📋 Purchase request created for ${Math.round(required_quantity - finalAvailableQuantity)} shortage of ${product.product_name}`,
            );
          } catch (error) {
            console.error("Error creating purchase request:", error);
          }
        }

        // Return the finished goods quantity from sales_inventory
        return resolve({
          statusCode: 200,
          message: "Finished goods available (from sales inventory)",
          data: {
            product_master_id,
            available_quantity: finalAvailableQuantity,
            has_stock: finishedGoodsInventory > 0,
            inventory_type: "finished_goods",
            unit_of_measure: unitOfMeasure,
            breakdown: {
              sales_inventory_qty: Math.round(finishedGoodsInventory),
              total_inventory: Math.round(totalFGQuantity),
              available_stock: Math.round(finishedGoodsInventory),
            },
            purchase_request_created: purchaseRequestCreated,
            shortage_amount:
              required_quantity && finalAvailableQuantity < required_quantity
                ? Math.round(required_quantity - finalAvailableQuantity)
                : 0,
          },
        });
      }

      // For products without finished goods in sales_inventory,
      // calculate from raw materials using BOM
      console.log(
        "DEBUG: No finished goods in sales_inventory - checking raw materials",
        {
          product_id: product.id,
          existsInSalesInventory,
          finishedGoodsInventory,
        },
      );

      // Get the BOM data for this product
      const bomEntries = await models.BillOfMaterials.findAll({
        where: { product_master_id: product.id, is_active: true },
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

      console.log("DEBUG: Processing BOM entry", {
        bom_id: firstBomEntry.id,
        procurement_product_id: firstBomEntry.procurement_product_id,
        quantity_required: firstBomEntry.quantity_required,
      });

      // Strategy 1: Try to get raw material via procurement product (if it exists and is not soft-deleted)
      let rawMaterialProductId = null;

      if (firstBomEntry.procurement_product_id) {
        try {
          const procurementProduct = await models.ProcurementProducts.findOne({
            where: {
              id: firstBomEntry.procurement_product_id,
              is_active: true,
            },
            attributes: ["product_master_id"],
            paranoid: false, // Include soft-deleted records temporarily to check if it was deleted
          });

          if (procurementProduct && procurementProduct.product_master_id) {
            rawMaterialProductId = procurementProduct.product_master_id;
            console.log(
              "DEBUG: Found raw material via procurement product:",
              rawMaterialProductId,
            );
          } else {
            console.log(
              "DEBUG: Procurement product exists but has no product_master_id or is deleted",
            );
          }
        } catch (e) {
          console.log("DEBUG: Error fetching procurement product:", e?.message);
        }
      }

      // Strategy 2: If no procurement product, infer raw material from BOM context
      // Assume finished products are made from same-species raw materials
      // Find a raw material of same species/derivative combination
      if (!rawMaterialProductId) {
        console.log(
          "DEBUG: Attempting to infer raw material from product species/derivative...",
        );

        try {
          // Get species of the finished product
          const productWithSpecies = await models.ProductMaster.findOne({
            where: { id: product.id, is_active: true },
            include: [
              {
                model: models.SpeciesMaster,
                as: "SpeciesMaster",
                attributes: ["id"],
                required: false,
              },
            ],
          });

          const speciesId = productWithSpecies?.SpeciesMaster?.id;

          if (speciesId) {
            // Find an unprocessed (raw) product from same species
            const rawMaterial = await models.ProductMaster.findOne({
              where: {
                species_master_id: speciesId,
                is_raw: true,
                is_active: true,
              },
              attributes: ["id", "product_name"],
            });

            if (rawMaterial) {
              rawMaterialProductId = rawMaterial.id;
              console.log(
                "DEBUG: Inferred raw material from species:",
                rawMaterial.product_name,
              );
            }
          }
        } catch (e) {
          console.log("DEBUG: Error inferring raw material:", e?.message);
        }
      }

      if (!rawMaterialProductId) {
        return resolve({
          statusCode: 200,
          message: "Could not determine raw material for this product",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
            inventory_type: "none",
          },
        });
      }

      // Fetch raw material product details
      const rawMaterialProduct = await models.ProductMaster.findOne({
        where: { id: rawMaterialProductId, is_active: true },
        attributes: [
          "id",
          "product_name",
          "species_derivative_size_grade_mapping_id",
        ],
      });

      // Check if raw material product was found
      if (!rawMaterialProduct) {
        console.log(
          "ERROR: Raw material product not found for ID:",
          rawMaterialProductId,
        );
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
        SELECT COALESCE(SUM(pi.available_stock), 0) as available_qty
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

      // Remove secondary UOM from bracket notation
      unitOfMeasure = cleanUOM(unitOfMeasure);

      // Check if purchase request is needed
      const finalAvailableQuantity = effectiveFinishedGoodsQty;
      let purchaseRequestCreated = false;

      // Check if an approved purchase request already exists for this product/order
      // Note: order_id is not passed in params, so this check is skipped
      // The order_id would need to be passed from the frontend for this to work

      // If no approved purchase request exists, check if we need to create one
      if (
        required_quantity &&
        finalAvailableQuantity < required_quantity &&
        !purchaseRequestCreated
      ) {
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
      fastify.log.error("CheckInventory Error:", {
        message: err.message,
        stack: err.stack,
        product_master_id: product_master_id,
      });
      reject({
        statusCode: 500,
        message: "Error checking inventory: " + err.message,
        error: err.message,
        debug_info: {
          product_master_id: product_master_id,
          error_type: err.constructor.name,
        },
      });
    }
  });
};

module.exports = { CheckInventory };
