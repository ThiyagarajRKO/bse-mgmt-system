import { UnitMaster } from "../../../controllers";

export const Get = ({ unit_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let unit_master = await UnitMaster.Get({
        id: unit_master_id,
      });

      if (!unit_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: unit_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
