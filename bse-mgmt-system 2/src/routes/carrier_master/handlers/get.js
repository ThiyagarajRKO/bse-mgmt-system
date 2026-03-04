import { CarrierMaster } from "../../../controllers";

export const Get = ({ carrier_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let carrier_master = await CarrierMaster.Get({
        id: carrier_master_id,
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
