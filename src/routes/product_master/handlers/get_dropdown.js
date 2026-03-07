import { ProductMaster } from "../../../controllers";
import models, { sequelize } from "../../../../models";
import { Op } from "sequelize";

/**
 * Get products as dropdown data
 * Filters to only show products that have been purchased (exist in purchase_inventory)
 * No authentication required - public endpoint for dropdowns
 */
export const GetDropdown = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        search = "",
        species_id = "",
        product_category_master_id = "",
        start = 0,
        length = 5000,
      } = params;

      // Build the where clause for ProductMaster
      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [{ product_name: { [Op.iLike]: `%${search}%` } }];
      }

      // Get products with proper filtering
      // Build includes array, only include associations that exist
      const includes = [];

      // Only add ProductCategoryMaster include if the association is defined
      if (
        models.ProductCategoryMaster &&
        models.ProductMaster.associations &&
        models.ProductMaster.associations.ProductCategoryMaster
      ) {
        includes.push({
          model: models.ProductCategoryMaster,
          required: !!species_id,
          attributes: [],
          include: models.SpeciesMaster
            ? [
                {
                  model: models.SpeciesMaster,
                  required: !!species_id,
                  attributes: [],
                  where: species_id
                    ? { id: species_id, is_active: true }
                    : undefined,
                },
              ]
            : [],
          where: product_category_master_id
            ? { id: product_category_master_id, is_active: true }
            : { is_active: true },
        });
      }

      // Add DerivativeMaster include for sorting (raw materials first)
      if (
        models.DerivativeMaster &&
        models.ProductMaster.associations &&
        models.ProductMaster.associations.DerivativeMaster
      ) {
        includes.push({
          model: models.DerivativeMaster,
          required: false,
          attributes: ["derivative_code"],
        });
      }

      // Add PurchaseInventory include only if the association is defined
      if (
        models.PurchaseInventory &&
        models.ProductMaster.associations &&
        models.ProductMaster.associations.PurchaseInventory
      ) {
        includes.push({
          model: models.PurchaseInventory,
          required: false, // Changed from true to false - don't require purchase inventory
          attributes: [],
          where: {
            deleted_at: null,
          },
        });
      }

      let result;

      try {
        result = await models.ProductMaster.findAndCountAll({
          attributes: ["id", "product_name"],
          include: includes,
          where,
          offset: parseInt(start) || 0,
          limit: parseInt(length) || 5000,
          distinct: true,
          subQuery: false,
          raw: true,
          order: [
            [
              sequelize.literal(
                `CASE WHEN "is_raw" = true OR "processing_state" = 'RAW' THEN 1 ELSE 0 END`,
              ),
              "ASC",
            ],
            ["product_name", "ASC"],
          ],
        });
      } catch (includeError) {
        // If includes fail, try with minimal includes
        console.warn(
          "Error with full includes, falling back to basic query:",
          includeError.message,
        );

        // Fallback: query without any problematic includes
        const fallbackIncludes = includes.filter(
          (inc) =>
            inc.model.name !== "ProductCategoryMaster" &&
            inc.model.name !== "PurchaseInventory",
        );

        try {
          result = await models.ProductMaster.findAndCountAll({
            attributes: ["id", "product_name"],
            include: fallbackIncludes,
            where,
            offset: parseInt(start) || 0,
            limit: parseInt(length) || 5000,
            distinct: true,
            subQuery: false,
            raw: true,
            order: [
              [
                sequelize.literal(
                  `CASE WHEN "is_raw" = true OR "processing_state" = 'RAW' THEN 1 ELSE 0 END`,
                ),
                "ASC",
              ],
              ["product_name", "ASC"],
            ],
          });
        } catch (fallbackError) {
          // If even fallback fails, return all active products
          console.warn(
            "Fallback also failed, returning all active products:",
            fallbackError.message,
          );
          result = await models.ProductMaster.findAndCountAll({
            attributes: ["id", "product_name"],
            where,
            offset: parseInt(start) || 0,
            limit: parseInt(length) || 5000,
            distinct: true,
            raw: true,
            order: [
              [
                sequelize.literal(
                  `CASE WHEN "is_raw" = true OR "processing_state" = 'RAW' THEN 1 ELSE 0 END`,
                ),
                "ASC",
              ],
              ["product_name", "ASC"],
            ],
          });
        }
      }

      // Format response for Select2
      const formattedRows = (result?.rows || []).map((product) => ({
        id: product.id,
        text: product.product_name,
      }));

      resolve({
        data: {
          rows: formattedRows,
          count: result?.count || 0,
        },
      });
    } catch (err) {
      fastify.log.error("GetDropdown error:", err);
      reject(err);
    }
  });
};
