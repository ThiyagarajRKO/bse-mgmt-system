import { VehicleMaster } from "../../../controllers";

export const Delete = ({ profile_id, vehicle_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const vehicle_master = await VehicleMaster.Delete({
        profile_id,
        id: vehicle_master_id,
      });

      if (vehicle_master?.[0] > 0) {
        return resolve({
          message: "Vehicle master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Vehicle master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
