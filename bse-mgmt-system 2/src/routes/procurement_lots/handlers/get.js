import { ProcurementLots } from "../../../controllers";

export const Get = ({ procurement_lot_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.Get({
        id: procurement_lot_id,
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
