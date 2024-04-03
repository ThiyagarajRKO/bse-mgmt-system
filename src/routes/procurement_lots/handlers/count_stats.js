import { ProcurementLots } from "../../../controllers";

export const CountStats = ({ procurement_lot }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.CountStats({
        procurement_lot,
      });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
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
