import { GradeMaster } from "../../../controllers";

export const Get = ({ grade_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let grade_master = await GradeMaster.Get({
        id: grade_master_id,
      });

      if (!grade_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: grade_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
