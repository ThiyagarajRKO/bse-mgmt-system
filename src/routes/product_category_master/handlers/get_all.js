import { ProductCategoryMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    product_category,
    species_master_name,
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
        search,
      });

      if (!product_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: product_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
