import { DriverMaster } from "../../../controllers";

export const Delete = ({ profile_id, driver_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const driver_master = await DriverMaster.Delete({
        profile_id,
        id: driver_master_id,
      });

      if (driver_master > 0) {
        return resolve({
          message: "Driver master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Driver master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
