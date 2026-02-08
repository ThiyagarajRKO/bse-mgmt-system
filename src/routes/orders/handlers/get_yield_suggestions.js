import models from "../../../../models";
import YieldBasedInventoryCalculator from "../../../services/yield_based_inventory_calculator";

export const GetYieldSuggestions = async (
  { product_id, finished_quantity, raw_quantity },
  session,
  fastify,
) => {
  console.log("GetYieldSuggestions function called");
  return new Promise(async (resolve, reject) => {
    try {
      console.log("GetYieldSuggestions called with params:", {
        product_id,
        finished_quantity,
        raw_quantity,
      });

      if (!product_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      if (
        (!finished_quantity || finished_quantity <= 0) &&
        (!raw_quantity || raw_quantity <= 0)
      ) {
        return reject({
          statusCode: 420,
          message:
            "Either finished quantity or raw quantity must be a positive number!",
        });
      }

      if (finished_quantity && raw_quantity) {
        return reject({
          statusCode: 420,
          message:
            "Please provide either finished_quantity OR raw_quantity, not both!",
        });
      }

      // Get product details
      const productMaster = await models.ProductMaster.findByPk(product_id, {
        include: [
          {
            model: models.SpeciesMaster,
            as: "SpeciesMaster",
            attributes: ["id", "species_name", "parent_category_type"],
          },
          {
            model: models.DerivativeMaster,
            as: "Derivative",
            attributes: ["id", "derivative_name", "derivative_code"],
          },
          {
            model: models.SizeMaster,
            as: "SizeMaster",
            attributes: ["unit_of_measure"],
          },
        ],
      });

      if (!productMaster) {
        return reject({
          statusCode: 404,
          message: "Product not found!",
        });
      }

      // Determine calculation mode and perform appropriate calculation
      let calculatedFinishedQuantity, calculatedRawQuantity, calculationMode;

      if (finished_quantity) {
        // Calculate required raw materials for the finished quantity
        calculatedRawQuantity =
          await YieldBasedInventoryCalculator.calculateRequiredRawMaterials(
            product_id,
            finished_quantity,
          );
        calculatedFinishedQuantity = finished_quantity;
        calculationMode = "finished_to_raw";
      } else {
        // Calculate finished yield from raw material quantity
        calculatedFinishedQuantity =
          await YieldBasedInventoryCalculator.calculateYieldFromRawMaterials(
            product_id,
            raw_quantity,
          );
        calculatedRawQuantity = raw_quantity;
        calculationMode = "raw_to_finished";
      }

      // STEP 1: Get BOM for this finished product
      // BOM tells us which raw materials (product_master_id) are needed and in what quantity
      const bom = await models.BillOfMaterials.findAll({
        where: {
          product_master_id: product_id,
          is_active: true,
        },
        attributes: ["id", "product_master_id", "quantity_required"],
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
          },
        ],
      });

      console.log(
        `[GetYieldSuggestions] Found ${bom.length} BOM entries for product ${product_id}`,
      );

      // STEP 2: Extract raw material product IDs from BOM
      // Note: BOM specifies product_master_id of raw materials, not procurement_product_id
      // Procurement products are created dynamically when purchase requests are generated
      const bomRawProductIds = bom
        .map((entry) => entry.product_master_id)
        .filter(Boolean);

      if (bomRawProductIds.length === 0) {
        console.warn(
          `[GetYieldSuggestions] ⚠️  No BOM found for product ${product_id}. Cannot determine raw materials.`,
        );
        return reject({
          statusCode: 422,
          message:
            "No Bill of Materials found for this finished product. Please configure BOM first.",
        });
      }

      // STEP 3: Get current available inventory ONLY for BOM raw materials
      // This ensures we only consider materials that are actually in the recipe
      const availableInventory = await models.PurchaseInventory.findAll({
        where: {
          product_master_id: { [models.Sequelize.Op.in]: bomRawProductIds },
          quantity: { [models.Sequelize.Op.gt]: 0 },
          is_active: true,
        },
        attributes: [
          "id",
          "quantity",
          "available_stock",
          "reserved_quantity",
          "product_master_id",
          "created_at",
        ],
      });

      // STEP 4: For each inventory item, find the actual procured product (if any)
      // This maps BOM raw materials with dynamically created procurement products
      let rawMaterialsWithProcurement = [];
      for (const inv of availableInventory) {
        // Find procurement products created for this raw material
        const procurementProducts = await models.ProcurementProducts.findAll({
          where: {
            product_master_id: inv.product_master_id,
            is_active: true,
          },
          attributes: ["id", "procurement_product_type"],
          include: [
            {
              model: models.ProductMaster,
              as: "ProductMaster",
              attributes: ["id", "product_name"],
            },
          ],
          limit: 1, // Use the most recent
          order: [["created_at", "DESC"]],
        });

        const procProduct = procurementProducts[0];
        const bomEntry = bom.find(
          (b) => b.product_master_id === inv.product_master_id,
        );

        rawMaterialsWithProcurement.push({
          inventory_id: inv.id,
          procurement_product_id: procProduct?.id || null,
          product_name: procProduct?.ProductMaster?.product_name || "Unknown",
          procurement_type:
            procProduct?.procurement_product_type || "UNPROCESSED",
          quantity: Math.ceil(parseFloat(inv.quantity || 0) * 100) / 100,
          available_quantity:
            Math.ceil(
              parseFloat(inv.available_stock || inv.quantity || 0) * 100,
            ) / 100,
          created_date: inv.created_at,
          bom_quantity_required: bomEntry?.quantity_required || null,
        });
      }

      const totalAvailable = availableInventory.reduce(
        (sum, item) => sum + parseFloat(item.quantity || 0),
        0,
      );

      console.log(
        `[GetYieldSuggestions] ✅ Found ${rawMaterialsWithProcurement.length} inventory records for BOM raw materials`,
      );

      // Enrich inventory details for display
      const rawMaterialsConsidered = rawMaterialsWithProcurement;

      // Get yield standard information
      const yieldStandard = await models.YieldStandardMaster.findOne({
        where: {
          species_id: productMaster.SpeciesMaster?.id,
          derivative_id: productMaster.Derivative?.id,
          processing_type: "RAW",
          is_active: true,
        },
        attributes: ["expected_yield_pct"],
      });

      const yieldPercentage = yieldStandard?.expected_yield_pct
        ? parseFloat(yieldStandard.expected_yield_pct) / 100
        : 0.6; // Default 60%

      // Check if this is a count-based derivative (like cephalopod rings)
      const isCephalopodRings =
        productMaster.SpeciesMaster?.parent_category_type === "Cephalopod" &&
        productMaster.Derivative?.derivative_code === "PRC_RINGS";

      const suggestions = {
        product_id,
        product_name: productMaster.product_name,
        species_name: productMaster.SpeciesMaster?.species_name,
        derivative_name: productMaster.Derivative?.derivative_name,
        unit_of_measure: productMaster.SizeMaster?.unit_of_measure || "kg",

        // Input values
        input_finished_quantity: finished_quantity || null,
        input_raw_quantity: raw_quantity || null,

        // Calculated values
        suggested_quantity: Math.ceil(calculatedFinishedQuantity * 100) / 100, // Frontend expects suggested_quantity
        required_raw_quantity: Math.ceil(calculatedRawQuantity * 100) / 100,

        current_available_inventory: Math.ceil(totalAvailable * 100) / 100,

        // ✅ NEW: Show raw materials considered for AI recommendation
        raw_materials_considered: rawMaterialsConsidered,
        raw_materials_count: rawMaterialsConsidered.length,

        yield_rate: yieldPercentage * 100, // Frontend expects yield_rate as percentage
        yield_percentage: yieldPercentage * 100,
        is_count_based: isCephalopodRings,

        calculation_mode: calculationMode,
        inventory_status:
          totalAvailable >= calculatedRawQuantity
            ? "sufficient"
            : "insufficient",
        shortage_amount: Math.max(
          0,
          Math.ceil((calculatedRawQuantity - totalAvailable) * 100) / 100,
        ),

        calculation_method: isCephalopodRings
          ? `Count-based: ${yieldPercentage} items per whole unit`
          : `Weight-based: ${yieldPercentage * 100}% yield rate`,
      };

      console.log("Yield suggestions calculated:", suggestions);

      resolve({
        statusCode: 200,
        message: "Yield suggestions calculated successfully",
        data: [suggestions], // Return as array to match frontend expectations
      });
    } catch (error) {
      console.error("Error in GetYieldSuggestions:", error);
      reject({
        statusCode: 500,
        message: "Internal server error while calculating yield suggestions",
      });
    }
  });
};
