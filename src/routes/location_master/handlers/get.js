import { LocationMaster } from "../../../controllers";

export const Get = ({ location_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let location_master = await LocationMaster.Get({
        id: location_master_id,
      });

      if (!location_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: location_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
