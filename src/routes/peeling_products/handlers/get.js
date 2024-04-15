import { Peeling } from "../../../controllers";

export const Get = ({ peeled_product_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeling_product = await Peeling.Get({
        id: peeled_product_id,
      });

      if (!peeling_product) {
        return reject({
          statusCode: 420,
          message: "No rows found!",
        });
      }

      resolve({
        data: peeling_product,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
