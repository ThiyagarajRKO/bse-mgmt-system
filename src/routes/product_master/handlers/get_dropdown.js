import { ProductMaster } from "../../../controllers";

/**
 * Get products as dropdown data
 * No authentication required - public endpoint for dropdowns
 */
export const GetDropdown = (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        search = "",
        species_id = "",
        product_category_master_id = "",
      } = params;

      // Call GetAll with pagination but limit to 5000 for dropdown performance
      const result = await ProductMaster.GetAll({
        start: 0,
        length: 5000,
        search: search,
        species_id: species_id || undefined,
        product_category_master_id: product_category_master_id || undefined,
      });

      if (!result || !result.rows) {
        return reject({
          statusCode: 420,
          message: "No products found!",
        });
      }

      // Return in format expected by Select2
      resolve({
        data: {
          rows: result.rows || [],
          count: result.count || 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
