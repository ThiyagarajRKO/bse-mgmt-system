import { ProductCategoryMaster } from "../../../controllers";

export const Delete = (
  { profile_id, product_category_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const product_master = await ProductCategoryMaster.Delete({
        profile_id,
        id: product_category_master_id,
      });

      if (product_master > 0) {
        return resolve({
          message: "Product category master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Product category master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
