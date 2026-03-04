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
          message: "No data found!",
        });
      }

      console.log("GET PRODUCT HANDLER - Retrieved product:", {
        product_name: product_master?.product_name,
        product_category_master_id: product_master?.product_category_master_id,
        ProductCategoryMaster: product_master?.ProductCategoryMaster,
        species_master_id:
          product_master?.ProductCategoryMaster?.species_master_id,
      });

      resolve({
        data: product_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
