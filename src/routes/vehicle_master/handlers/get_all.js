import { VehicleMaster } from "../../../controllers";

export const GetAll = (
  { vehicle_number, model_number, vehicle_brand },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let vehicle_master = await VehicleMaster.GetAll({
        vehicle_number,
        model_number,
        vehicle_brand,
      });

      if (!vehicle_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
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
