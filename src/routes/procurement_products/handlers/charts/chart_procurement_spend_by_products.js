import { ProcurementProducts } from "../../../../controllers";

export const GetProcurementSpendByProducts = (
  { from_date, to_date },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement =
        await ProcurementProducts.GetProcurementSpendByProductsData({
          from_date,
          to_date,
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
