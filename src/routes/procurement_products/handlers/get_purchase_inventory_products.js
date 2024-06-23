import { ProcurementProducts } from "../../../controllers";

export const GetPurchaseInventoryItems = (
  {
    product_master_id,
    procurement_product_type,
    start,
    length,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementProducts.GetPurchaseInventoryProducts({
        product_master_id,
        procurement_product_type,
        start,
        length,
        search,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: procurement,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
