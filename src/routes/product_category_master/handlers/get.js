import { ProductCategoryMaster } from "../../../controllers";

export const Get = ({ product_category_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_master = await ProductCategoryMaster.Get({
        id: product_category_master_id,
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
