import { ProductCategoryMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    product_category,
    species_master_name,
    parent_category_type,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductCategoryMaster.GetAll({
        start,
        length,
        product_category,
        species_master_name,
        parent_category_type,
        search,
      });

      if (!product_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      // product_master is { rows: [...], count: N } from findAndCountAll
      resolve({
        data: {
          rows: product_master.rows || [],
          count: product_master.count || 0,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
