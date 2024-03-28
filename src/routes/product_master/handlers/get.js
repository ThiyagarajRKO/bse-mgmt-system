import { ProductMaster } from "../../../controllers";

export const Get = ({ product_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductMaster.Get({
        id: product_master_id,
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
