import { ProductMaster } from "../../../controllers";
import models, { sequelize } from "../../../../models";

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
      } = params;

      // First, get all distinct product_master_ids from purchase_inventory
      const purchasedProductIds = await models.PurchaseInventory.findAll({
        attributes: [
          [
            sequelize.fn("DISTINCT", sequelize.col("product_master_id")),
            "product_master_id",
          ],
        ],
        where: {
          deleted_at: null,
        },
        raw: true,
      });

      const purchasedIds = purchasedProductIds.map((p) => p.product_master_id);

      if (purchasedIds.length === 0) {
        return resolve({
          data: {
            rows: [],
            count: 0,
          },
        });
      }

      // Call GetAll with pagination but limit to 5000 for dropdown performance
      // and filter to only purchased products
      const result = await ProductMaster.GetAll({
        start: 0,
        length: 5000,
        search: search,
        species_id: species_id || undefined,
        product_category_master_id: product_category_master_id || undefined,
        product_ids: purchasedIds, // Pass the list of purchased product IDs
      });

      if (!result || !result.rows) {
        return resolve({
          data: {
            rows: [],
            count: 0,
          },
        });
      }

      // Filter results to only include purchased products
      const filteredRows = result.rows.filter((product) =>
        purchasedIds.includes(product.id)
      );

      // Return in format expected by Select2
      resolve({
        data: {
          rows: filteredRows || [],
          count: filteredRows.length || 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
