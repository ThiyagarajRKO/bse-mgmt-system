import { Procurement } from "../../../controllers";

export const Get = ({ procurement_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await Procurement.Get({
        id: procurement_id,
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
