import { ProcurementLots } from "../../../controllers";

export const GetPeeledLots = ({ start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeled = await ProcurementLots.GetPeeledLots({
        start,
        length,
      });

      if (!peeled) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: peeled,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
