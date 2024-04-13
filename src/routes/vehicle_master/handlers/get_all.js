import { VehicleMaster } from "../../../controllers";

export const GetAll = (
  {
    start,
    length,
    vehicle_number,
    model_number,
    vehicle_brand,
    "search[value]": search,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let vehicle_master = await VehicleMaster.GetAll({
        start,
        length,
        vehicle_number,
        model_number,
        vehicle_brand,
        search,
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
