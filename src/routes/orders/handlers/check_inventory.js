import models from "../../../../models";

export const CheckInventory = async (
  { product_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      let procProductIds = [];

      // Step 1: Check if this product has direct procurement products (raw materials)
      const directProcProducts = await models.ProcurementProducts.findAll({
        where: {
          product_master_id,
          is_active: true,
        },
        attributes: ["id"],
      });

      if (directProcProducts && directProcProducts.length > 0) {
        procProductIds = directProcProducts.map((p) => p.id);
      } else {
        // Step 2: If no direct procurement products, use BOM to find raw materials
        // This handles finished products (e.g., IQF) that require raw materials (e.g., Whole Raw)

        // First, get the product's category
        const product = await models.ProductMaster.findOne({
          where: { id: product_master_id, is_active: true },
          attributes: ["id", "product_category_master_id"],
        });

        if (product?.product_category_master_id) {
          // Get the category to find species
          const category = await models.ProductCategoryMaster.findOne({
            where: { id: product.product_category_master_id },
            attributes: ["species_master_id"],
          });

          if (category?.species_master_id) {
            const speciesId = category.species_master_id;

            // Find BOMs for this species
            const boms = await models.BomMaster.findAll({
              where: {
                species_id: speciesId,
                is_active: true,
              },
              attributes: ["id"],
              include: [
                {
                  model: models.BomInput,
                  as: "inputs",
                  attributes: ["raw_product_id"],
                  required: true,
                },
              ],
            });

            if (boms && boms.length > 0) {
              // Extract all raw product IDs from BOM inputs
              const rawProductIds = [];
              boms.forEach((bom) => {
                bom.inputs.forEach((input) => {
                  if (
                    input.raw_product_id &&
                    !rawProductIds.includes(input.raw_product_id)
                  ) {
                    rawProductIds.push(input.raw_product_id);
                  }
                });
              });

              // Get procurement products for these raw materials
              if (rawProductIds.length > 0) {
                const rawProcProducts =
                  await models.ProcurementProducts.findAll({
                    where: {
                      product_master_id: rawProductIds,
                      is_active: true,
                    },
                    attributes: ["id"],
                  });

                if (rawProcProducts && rawProcProducts.length > 0) {
                  procProductIds = rawProcProducts.map((p) => p.id);
                }
              }
            }
          }
        }
      }

      let totalPurchaseInventory = 0;

      // Sum up purchase inventory for all relevant procurement products
      if (procProductIds.length > 0) {
        const purchaseInventories = await models.PurchaseInventory.findAll({
          where: {
            procurement_product_id: procProductIds,
            is_active: true,
          },
          attributes: ["quantity"],
        });

        totalPurchaseInventory = purchaseInventories.reduce((sum, inv) => {
          const qty = inv?.quantity;
          // Only add if quantity is a valid number (not null, NaN, or undefined)
          if (qty !== null && qty !== undefined && !isNaN(qty)) {
            return sum + qty;
          }
          return sum;
        }, 0);
      }

      resolve({
        statusCode: 200,
        message: "Inventory checked successfully",
        data: {
          product_master_id,
          available_quantity: totalPurchaseInventory,
          has_stock: totalPurchaseInventory > 0,
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
