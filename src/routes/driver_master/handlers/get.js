import { DriverMaster } from "../../../controllers";

export const Get = ({ driver_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let driver_master = await DriverMaster.Get({
        id: driver_master_id,
      });

      if (!driver_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: driver_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
