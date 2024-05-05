import { CarrierMaster } from "../../../controllers";

export const GetAll = (
  { start, length, carrier_name, carrier_country, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let carrier_master = await CarrierMaster.GetAll({
        start,
        length,
        carrier_name,
        carrier_country,
        search,
      });

      if (!carrier_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: carrier_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
