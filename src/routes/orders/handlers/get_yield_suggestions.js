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

      // Get current available inventory for this product
      const availableInventory = await models.PurchaseInventory.findAll({
        where: {
          product_master_id: product_id,
          quantity: { [models.Sequelize.Op.gt]: 0 },
          is_active: true,
        },
        attributes: ["quantity"],
        include: [
          {
            model: models.ProcurementProducts,
            as: "ProcurementProduct",
            attributes: ["procurement_product_type"],
          },
        ],
      });

      const totalAvailable = availableInventory.reduce(
        (sum, item) => sum + parseFloat(item.quantity || 0),
        0,
      );

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
