import { ProcurementProducts } from "../../../controllers";

export const GetPaidStatus = (
  { procurement_product_id, supplier_master_id },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementProducts.GetPaidStatus({
        id: procurement_product_id,
        supplier_master_id,
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
