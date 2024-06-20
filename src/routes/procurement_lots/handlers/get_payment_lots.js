import { ProcurementLots } from "../../../controllers";

export const GetPaymentLots = (
  { supplier_id, start, length },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetPaymentLots({
        supplier_id,
        start,
        length,
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
