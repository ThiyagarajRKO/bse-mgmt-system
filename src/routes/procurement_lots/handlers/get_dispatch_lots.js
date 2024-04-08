import { ProcurementLots } from "../../../controllers";

export const GetDispatchLots = ({ start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetDispatchLots({
        start,
        length,
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
