import { LocationMaster } from "../../../controllers";

export const GetAll = ({ location_name, start, length }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let location_master = await LocationMaster.GetAll({
        location_name,
        start,
        length,
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
