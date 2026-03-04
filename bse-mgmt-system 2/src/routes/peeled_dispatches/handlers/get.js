import { PeeledDispatches } from "../../../controllers";

export const Get = ({ peeled_dispatch_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeled_dispatch = await PeeledDispatches.Get({
        id: peeled_dispatch_id,
      });

      if (!peeled_dispatch) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: peeled_dispatch,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
