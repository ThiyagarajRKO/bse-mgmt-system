import { DivisionMaster } from "../../../controllers";

export const Get = ({ division_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let division_master = await DivisionMaster.Get({
        id: division_master_id,
      });

      if (!division_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: division_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
