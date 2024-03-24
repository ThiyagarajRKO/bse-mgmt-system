import { DriverMaster } from "../../../controllers";

export const GetAll = (
  { driver_name, address, phone, blood_group, health_history },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let driver_master = await DriverMaster.GetAll({
        driver_name,
        address,
        phone,
        blood_group,
        health_history,
      });

      if (!driver_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
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
