import { GradeMaster } from "../../../controllers";

export const GetAll = ({ start, length, grade_name }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let grade_master = await GradeMaster.GetAll({
        start,
        length,
        grade_name,
      });

      if (!grade_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
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
