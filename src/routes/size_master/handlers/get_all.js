import { SizeMaster } from "../../../controllers";

export const GetAll = ({ start, length, grade_name }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let size_master = await SizeMaster.GetAll({
        start,
        length,
        grade_name,
      });

      if (!size_master) {
        return reject({
          statusCode: 420,
          message: "No roles found!",
        });
      }

      resolve({
        data: size_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
