import { ProductMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    product_name,
    species_master_name,
    product_category_name,
    product_size,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductMaster.GetAll({
        start,
        length,
        product_name,
        species_master_name,
        product_category_name,
        product_size,
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
