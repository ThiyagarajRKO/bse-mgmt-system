import { PriceListMaster } from "../../../controllers";

export const Get = ({ price_list_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let price_list_data = await PriceListMaster.Get({
        id: price_list_master_id,
      });

      if (!price_list_data) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: price_list_data,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
