import { PriceListProductMaster } from "../../../controllers";

export const Delete = (
  { profile_id, price_list_product_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const price_list_product_master = await PriceListProductMaster.Delete({
        profile_id,
        id: price_list_product_master_id,
      });

      if (price_list_product_master > 0) {
        return resolve({
          message: "Price list product master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Price list product master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
