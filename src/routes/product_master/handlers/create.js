import {
  ProductCategoryMaster,
  ProductMaster,
  SizeMaster,
} from "../../../controllers";

export const Create = (
  { profile_id, product_category_master_id, size_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product_category_count = await ProductCategoryMaster.Count({
        id: product_category_master_id,
      });

      if (product_category_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid product category master id!",
        });
      }

      const size_count = await SizeMaster.Count({
        id: size_master_id,
      });

      if (size_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid size master master id!",
        });
      }

      const product_master = await ProductMaster.Insert(profile_id, {
        product_category_master_id,
        size_master_id,
        is_active: true,
      });

      resolve({
        message: "Product master has been inserted successfully",
        data: {
          product_master_id: product_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
