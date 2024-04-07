import { Peeling } from "../../../controllers";

export const Get = ({ peeling_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeling = await Peeling.Get({
        id: peeling_id,
      });

      if (!peeling) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
        });
      }

      resolve({
        data: peeling,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
