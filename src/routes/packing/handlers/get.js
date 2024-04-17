import { Packing } from "../../../controllers";

export const Get = ({ packing_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packing = await Packing.Get({
        id: packing_id,
      });

      if (!packing) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: packing,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
