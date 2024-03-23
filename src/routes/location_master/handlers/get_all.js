import { LocationMaster } from "../../../controllers";

export const GetAll = ({ vendor_name, location_name }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let location_master = await LocationMaster.GetAll({
        vendor_name,
        location_name,
      });

      if (!location_master) {
        return reject({
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
