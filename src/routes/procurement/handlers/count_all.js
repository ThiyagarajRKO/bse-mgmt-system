import { Procurement } from "../../../controllers";

export const CountAll = ({}, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let procurement = await Procurement.CountAll();

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
