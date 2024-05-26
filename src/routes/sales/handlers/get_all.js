import { Sales } from "../../../controllers";

export const GetAll = (
  { start, length, sales_id, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let sales = await Sales.GetAll({
        start,
        length,
        sales_id,
        search,
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
