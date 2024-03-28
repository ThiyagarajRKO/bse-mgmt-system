import { ProductMaster } from "../../../controllers";

export const GetAll = (
  { start, length, product_short_code, product_name, species_master_name },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductMaster.GetAll({
        start,
        length,
        product_short_code,
        product_name,
        species_master_name,
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
