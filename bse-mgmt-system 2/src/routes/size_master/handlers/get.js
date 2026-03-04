import { SizeMaster } from "../../../controllers";

export const Get = ({ size_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let size_master = await SizeMaster.Get({
        id: size_master_id,
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
