import { PriceListMaster } from "../../../controllers";

export const GetAll = (
  { start, length, price_list_name, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let price_list_master = await PriceListMaster.GetAll({
        start,
        length,
        price_list_name,
        search,
      });

      if (!price_list_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: price_list_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
