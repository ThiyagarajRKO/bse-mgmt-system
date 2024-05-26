import { Sales } from "../../../controllers";

export const Get = ({ sales_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let sales = await Sales.Get({
        id: sales_id,
      });

      if (!sales) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: sales,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
