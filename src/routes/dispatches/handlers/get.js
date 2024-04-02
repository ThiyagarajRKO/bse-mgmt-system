import { Dispatches } from "../../../controllers";

export const Get = ({ dispatch_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let dispatch = await Dispatches.Get({
        id: dispatch_id,
      });

      if (!dispatch) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: dispatch,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
