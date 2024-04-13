import { PackagingMaster } from "../../../controllers";

export const Get = ({ packaging_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let packaging_master = await PackagingMaster.Get({
        id: packaging_master_id,
      });

      if (!packaging_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: packaging_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
