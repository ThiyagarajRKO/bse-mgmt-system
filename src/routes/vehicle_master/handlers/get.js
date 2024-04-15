import { VehicleMaster } from "../../../controllers";

export const Get = ({ vehicle_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let vehicle_master = await VehicleMaster.Get({
        id: vehicle_master_id,
      });

      if (!vehicle_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: vehicle_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
