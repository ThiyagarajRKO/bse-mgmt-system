const models = require("../../../../models");
const YieldBasedInventoryCalculator = require("../../../services/yield_based_inventory_calculator");

const CheckInventory = async (
  { product_master_id, order_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("CheckInventory called with:", {
        product_master_id,
        order_id,
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
            attributes: ["id", "size_master_id"],
            required: false,
            include: [
              {
                model: models.SizeMaster,
                as: "SizeMaster",
                attributes: ["id", "size_name", "unit_of_measure"],
                required: false,
              },
            ],
          },
        ],
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

      // Check if this is a processed product by looking for procurement products
      const procurementProduct = await models.ProcurementProducts.findOne({
        where: { product_master_id: product.id, is_active: true },
        attributes: ["id", "procurement_product_type"],
        limit: 1,
      });

      const isProcessedProduct =
        procurementProduct?.procurement_product_type === "PROCESSED";

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
      });

      const allowedUnitIds = allowedUnits.map((unit) => unit.id);

      const fgSumQuery = `
        SELECT COALESCE(SUM(inv.available_qty), 0) as fg_available_qty
        FROM inventory_stock inv
        WHERE inv.product_id = :product_id
        AND inv.unit_id IN (:allowedUnitIds)
      `;

      const [fgResult] = await models.sequelize.query(fgSumQuery, {
        replacements: {
          product_id: product.id,
          allowedUnitIds: allowedUnitIds.length > 0 ? allowedUnitIds : [null],
        },
        type: models.sequelize.QueryTypes.SELECT,
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

      // If we have finished goods inventory, treat as processed product
      if (totalFGInventory > 0 || isProcessedProduct) {
        // Fetch sales/allocated quantities - total and order-specific
        let salesQuery = `
          SELECT COALESCE(SUM(si.quantity), 0) as total_sales_inventory_qty
          FROM sales_inventory si
          WHERE si.product_master_id = :product_id
          AND si.is_active = true
        `;

        let replacements = { product_id: product.id };

        if (order_id) {
          salesQuery += ` AND si.order_id != :order_id`;
          replacements.order_id = order_id;
        }

        const [salesResult] = await models.sequelize.query(salesQuery, {
          replacements,
          type: models.sequelize.QueryTypes.SELECT,
        });

        const totalSalesAllocations = parseFloat(
          salesResult?.total_sales_inventory_qty || 0,
        );

        // If order_id provided, also get allocations for this specific order
        let orderSpecificAllocations = 0;
        if (order_id) {
          const orderQuery = `
            SELECT COALESCE(SUM(si.quantity), 0) as order_sales_inventory_qty
            FROM sales_inventory si
            WHERE si.product_master_id = :product_id
            AND si.order_id = :order_id
            AND si.is_active = true
          `;

          const [orderResult] = await models.sequelize.query(orderQuery, {
            replacements: { product_id: product.id, order_id },
            type: models.sequelize.QueryTypes.SELECT,
          });

          orderSpecificAllocations = parseFloat(
            orderResult?.order_sales_inventory_qty || 0,
          );
        }

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
          product?.MappingProfile?.SizeMaster?.unit_of_measure || "kg";

        // If nested include didn't work, try to fetch the mapping separately
        if (unitOfMeasure === "kg" && product.species_derivative_size_grade_mapping_id) {
          try {
            const mapping = await models.species_derivative_size_grade_mapping.findOne({
              where: { id: product.species_derivative_size_grade_mapping_id },
              include: [
                {
                  model: models.SizeMaster,
                  as: "SizeMaster",
                  attributes: ["id", "size_name", "unit_of_measure"],
                  required: false,
                },
              ],
            });
            if (mapping?.SizeMaster?.unit_of_measure) {
              unitOfMeasure = mapping.SizeMaster.unit_of_measure;
            }
          } catch (error) {
            console.log("Error fetching mapping separately:", error.message);
          }
        }

        // Return the actual available quantity from inventory_stock (already accounts for allocations)
        return resolve({
          statusCode: 200,
          message: "Available inventory (unallocated stock only)",
          data: {
            product_master_id,
            available_quantity: Number(totalFGInventory), // This is already the available (unallocated) quantity
            has_stock: totalFGInventory > 0,
            inventory_type: totalFGInventory > 0 ? "finished_goods" : "none",
            unit_of_measure: unitOfMeasure,
            breakdown: {
              sales_inventory: Number(totalSalesAllocations), // Allocated to sales
              fg_inventory: Number(totalFGInventory), // Available FG inventory
              total_inventory: Number(totalFGQuantity),
              total_allocations: Number(
                totalSalesAllocations +
                  (order_id ? orderSpecificAllocations : 0),
              ),
              available_stock: Number(totalFGInventory),
              order_allocations: order_id
                ? Number(orderSpecificAllocations)
                : undefined,
            },
          },
        });
      }

      // For unprocessed/raw material products, check purchase_inventory through BOM
      // Get the yield percentage for this product using BOM
      const yieldData = await models.BomOutput?.findOne?.({
        where: { product_id: product.id },
        attributes: ["id", "base_yield_percent"],
        include: [
          {
            model: models.BomMaster,
            attributes: ["id"],
            required: true,
            include: [
              {
                model: models.BomInput,
                as: "inputs",
                attributes: ["raw_product_id", "quantity"],
                required: false,
              },
            ],
          },
        ],
        raw: false,
      }).catch((err) => {
        console.error("BomOutput query error:", err);
        return null;
      });

      if (!yieldData?.BomMaster?.inputs?.length) {
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

      // Get raw material from BOM inputs
      const firstInput = yieldData.BomMaster.inputs[0];
      const rawMaterialProduct = await models.ProductMaster.findOne({
        where: { id: firstInput.raw_product_id },
        attributes: ["id", "product_name"],
      });

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

      // Calculate effective finished goods quantity using yield standards
      const effectiveFinishedGoodsQty =
        await YieldBasedInventoryCalculator.calculateEffectiveInventory(
          rawMaterialProduct.id, // Use raw material product ID for yield calculation
          rawMaterialStockKg,
        );

        // Get unit of measure from the mapping
        let unitOfMeasure =
          product?.MappingProfile?.SizeMaster?.unit_of_measure || "kg";      resolve({
        statusCode: 200,
        message:
          effectiveFinishedGoodsQty > 0
            ? "Raw materials inventory available (yield-adjusted)"
            : "No raw materials available",
        data: {
          product_master_id,
          available_quantity: effectiveFinishedGoodsQty,
          has_stock: effectiveFinishedGoodsQty > 0,
          inventory_type:
            effectiveFinishedGoodsQty > 0 ? "raw_materials" : "none",
          unit_of_measure: unitOfMeasure,
          raw_material_details: {
            product_name: rawMaterialProduct.product_name,
            raw_material_quantity: rawMaterialStockKg,
            yield_percent: yieldData.base_yield_percent,
            effective_yield_used: true,
          },
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
