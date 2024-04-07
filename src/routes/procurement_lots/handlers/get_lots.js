import { ProcurementLots } from "../../../controllers";

export const GetLots = ({ start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await ProcurementLots.GetLots({ start, length });

      if (!procurement) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
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
