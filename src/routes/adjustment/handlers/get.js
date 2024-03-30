import { Adjustment } from "../../../controllers";

export const Get = ({ adjustment_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let adjustment = await Adjustment.Get({
        id: adjustment_id,
      });

      if (!adjustment) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: adjustment,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
