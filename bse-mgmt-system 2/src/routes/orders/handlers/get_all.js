import { Orders } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let orders = await Orders.GetAll({
        start,
        length,
        search,
      });

      if (!orders) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: orders,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
