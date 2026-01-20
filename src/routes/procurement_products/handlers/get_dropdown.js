import models, { sequelize } from "../../../../models";
import { Op } from "sequelize";

/**
 * Get raw materials as dropdown data for procurement product selection
 * Returns only RAW products (is_raw = true) that can be procured
 * No authentication required - public endpoint for dropdowns
 */
export const GetDropdown = async (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { search = "", start = 0, length = 5000 } = params;

      // Build the where clause for ProductMaster - ONLY RAW MATERIALS
      let where = {
        is_active: true,
        is_raw: true, // Only raw materials
      };

      if (search) {
        where[Op.or] = [{ product_name: { [Op.iLike]: `%${search}%` } }];
      }

      let result;

      try {
        result = await models.ProductMaster.findAndCountAll({
          attributes: ["id", "product_name"],
          where,
          offset: parseInt(start) || 0,
          limit: parseInt(length) || 5000,
          distinct: true,
          raw: true,
          order: [["product_name", "ASC"]],
        });
      } catch (err) {
        console.error("Error fetching raw materials dropdown:", err);
        reject(err);
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
