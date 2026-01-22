import models from "../../../../models";

export const CheckInventory = async (
  { product_master_id, order_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
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
        ],
        include: [
          {
            model: models.DerivativeMaster,
            as: "Derivative",
            attributes: ["id", "derivative_code", "derivative_name"],
            required: false,
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
      const fgSumQuery = `
        SELECT COALESCE(SUM(inv.available_qty), 0) as fg_available_qty
        FROM inventory_stock inv
        JOIN unit_master um ON inv.unit_id::uuid = um.id
        WHERE inv.product_id = :product_id
        AND um.unit_code ILIKE '%cs%'
      `;

      const [fgResult] = await models.sequelize.query(fgSumQuery, {
        replacements: { product_id: product.id },
        type: models.sequelize.QueryTypes.SELECT,
      });

      const totalFGInventory = parseFloat(fgResult?.fg_available_qty || 0);

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

        // Return the actual available quantity from inventory_stock (already accounts for allocations)
        return resolve({
          statusCode: 200,
          message: "Available inventory (unallocated stock only)",
          data: {
            product_master_id,
            available_quantity: Number(totalFGInventory), // This is already the unallocated stock
            has_stock: totalFGInventory > 0,
            inventory_type: totalFGInventory > 0 ? "finished_goods" : "none",
            breakdown: {
              fg_inventory: Number(totalFGInventory),
              total_allocations: Number(
                totalSalesAllocations +
                  (order_id ? orderSpecificAllocations : 0),
              ),
              order_allocations: order_id
                ? Number(orderSpecificAllocations)
                : undefined,
              net_available: Number(totalFGInventory), // Same as available_quantity since FG inventory already excludes allocated stock
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
        INNER JOIN procurement_products pp ON pi.procurement_product_id = pp.id
        WHERE pp.product_master_id = :product_id
        AND pi.is_active = true
      `;

      const [inventoryResult] = await models.sequelize.query(inventoryQuery, {
        replacements: { product_id: rawMaterialProduct.id },
        type: models.sequelize.QueryTypes.SELECT,
      });

      const availableStockKg = inventoryResult?.available_qty || 0;

      resolve({
        statusCode: 200,
        message:
          availableStockKg > 0
            ? "Raw materials inventory available"
            : "No raw materials available",
        data: {
          product_master_id,
          available_quantity: availableStockKg,
          has_stock: availableStockKg > 0,
          inventory_type: availableStockKg > 0 ? "raw_materials" : "none",
          raw_material_details: {
            product_name: rawMaterialProduct.product_name,
            yield_percent: yieldData.base_yield_percent,
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
