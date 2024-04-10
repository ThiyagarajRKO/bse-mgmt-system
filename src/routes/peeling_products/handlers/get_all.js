import { PeelingProducts } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let peeling_products = await PeelingProducts.GetAll({
        start,
        length,
        search,
      });

      if (!peeling_products) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: peeling_products,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
