import { DriverMaster } from "../../../controllers";

export const GetAll = (
  {
    driver_name,
    address,
    phone,
    blood_group,
    health_history,
    start,
    length,
    "search[value]": search,
  },
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
        start,
        length,
        search,
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
