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

      // Step 1: Get the product and its species
      const product = await models.ProductMaster.findOne({
        where: { id: product_master_id, is_active: true },
        attributes: ["id", "product_name"],
      });

      if (!product) {
        return resolve({
          statusCode: 200,
          message: "Product not found",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
          },
        });
      }

      // Step 2: Get the species of the product via the species_derivative_size_grade_mapping
      const productMapping = await models.sequelize.query(
        `SELECT DISTINCT sm.id as species_id
         FROM product_master pm
         LEFT JOIN species_derivative_size_grade_mapping sdsgm ON pm.species_derivative_size_grade_mapping_id = sdsgm.id
         LEFT JOIN species_master sm ON sdsgm.species_master_id = sm.id
         WHERE pm.id = :product_id`,
        {
          replacements: { product_id: product_master_id },
          type: models.sequelize.QueryTypes.SELECT,
        }
      );

      if (
        !productMapping ||
        productMapping.length === 0 ||
        !productMapping[0].species_id
      ) {
        return resolve({
          statusCode: 200,
          message: "Product species not found",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
          },
        });
      }

      const speciesId = productMapping[0].species_id;

      // Step 3: Find BOMs for this species
      const bomsForSpecies = await models.BomMaster.findAll({
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

      if (!bomsForSpecies || bomsForSpecies.length === 0) {
        return resolve({
          statusCode: 200,
          message: "No BOMs found for this species",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
          },
        });
      }

      // Step 4: Extract all raw product IDs from BOMs
      const rawProductIds = [];
      bomsForSpecies.forEach((bom) => {
        if (bom.inputs && bom.inputs.length > 0) {
          bom.inputs.forEach((input) => {
            if (
              input.raw_product_id &&
              !rawProductIds.includes(input.raw_product_id)
            ) {
              rawProductIds.push(input.raw_product_id);
            }
          });
        }
      });

      if (rawProductIds.length === 0) {
        return resolve({
          statusCode: 200,
          message: "No raw materials defined in BOMs",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
          },
        });
      }

      // Step 5: Get procurement products for these raw materials
      const rawProcProducts = await models.ProcurementProducts.findAll({
        where: {
          product_master_id: rawProductIds,
          is_active: true,
        },
        attributes: ["id"],
      });

      if (!rawProcProducts || rawProcProducts.length === 0) {
        return resolve({
          statusCode: 200,
          message: "No procurement products found for raw materials",
          data: {
            product_master_id,
            available_quantity: 0,
            has_stock: false,
          },
        });
      }

      const procProductIds = rawProcProducts.map((p) => p.id);

      // Step 6: Sum inventory for the relevant raw materials only
      let totalPurchaseInventory = 0;

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
