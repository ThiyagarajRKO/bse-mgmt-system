import { SizeMaster } from "../../../controllers";

export const GetAll = (
  { start, length, grade_name, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let size_master = await SizeMaster.GetAll({
        start,
        length,
        grade_name,
        search,
      });

      if (!size_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
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
